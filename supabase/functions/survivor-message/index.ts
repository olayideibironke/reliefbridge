import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json"}});
const esc=(v:string)=>v.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]!));

Deno.serve(async(req)=>{
  if(req.method!=="POST") return json({error:"Method not allowed"},405);
  const url=Deno.env.get("SUPABASE_URL")!;
  const anon=Deno.env.get("SUPABASE_ANON_KEY")!;
  const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const resend=Deno.env.get("RESEND_API_KEY");
  const authorization=req.headers.get("Authorization");
  if(!authorization) return json({error:"Unauthorized"},401);
  if(!resend) return json({error:"ReliefBridge email service is not configured."},503);

  const caller=createClient(url,anon,{global:{headers:{Authorization:authorization}}});
  const {data:{user}}=await caller.auth.getUser();
  if(!user) return json({error:"Unauthorized"},401);

  const admin=createClient(url,service,{auth:{autoRefreshToken:false,persistSession:false}});
  const {data:profile}=await admin.from("profiles").select("id,organization_id,first_name,last_name,role,access_status").eq("id",user.id).maybeSingle();
  if(!profile?.organization_id||profile.access_status!=="active") return json({error:"Forbidden"},403);

  const {data:cap}=await admin.from("organization_capabilities").select("communications_mode").eq("organization_id",profile.organization_id).maybeSingle();
  if(cap?.communications_mode!=="staff_survivor") return json({error:"Survivor communications are not enabled for this organization."},403);

  const body=await req.json().catch(()=>({}));
  const survivorId=String(body.survivor_id??"");
  const subject=String(body.subject??"").trim();
  const message=String(body.body??"").trim();
  if(!survivorId||!subject||!message) return json({error:"Survivor, subject, and message are required."},400);
  if(subject.length>180||message.length>10000) return json({error:"Message is too long."},400);

  const {data:survivor}=await admin.from("survivors").select("id,organization_id,first_name,last_name,email,consent_given").eq("id",survivorId).maybeSingle();
  if(!survivor||survivor.organization_id!==profile.organization_id) return json({error:"Survivor not found."},404);
  if(!survivor.consent_given) return json({error:"Survivor communication consent is required before sending."},400);
  if(!survivor.email) return json({error:"This survivor does not have an email address on file."},400);

  const {data:record,error:insertError}=await admin.from("survivor_communications").insert({
    organization_id:profile.organization_id,survivor_id:survivor.id,sender_profile_id:profile.id,
    channel:"email",subject,body:message,status:"pending"
  }).select("id").single();
  if(insertError||!record) return json({error:"Could not create communication record."},500);

  const sender=[profile.first_name,profile.last_name].filter(Boolean).join(" ")||"ReliefBridge team";
  const recipient=[survivor.first_name,survivor.last_name].filter(Boolean).join(" ")||"there";
  try{
    const res=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+resend,"Content-Type":"application/json"},body:JSON.stringify({
      from:"ReliefBridge <contact@reliefbridge.net>",to:[survivor.email],reply_to:"contact@reliefbridge.net",subject,
      text:message+"\n\nSent by "+sender+" through ReliefBridge.",
      html:`<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#172033"><p>Hello ${esc(recipient)},</p><div style="white-space:pre-wrap;line-height:1.55">${esc(message)}</div><p style="margin-top:24px;color:#596579;font-size:13px">Sent by ${esc(sender)} through ReliefBridge.</p></div>`
    })});
    const result=await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(String(result?.message||"Email delivery failed."));
    await admin.from("survivor_communications").update({status:"sent",provider_id:String(result?.id||""),sent_at:new Date().toISOString(),error_message:null}).eq("id",record.id);
    return json({ok:true,id:record.id,status:"sent"});
  }catch(e){
    const messageText=e instanceof Error?e.message:"Email delivery failed.";
    await admin.from("survivor_communications").update({status:"failed",error_message:messageText}).eq("id",record.id);
    return json({error:messageText,id:record.id},502);
  }
});