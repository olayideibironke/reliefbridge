import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
// Version-controlled source captured from deployed demo-admin v10. Do not deploy until migration and QA pass.
const validLocale=(value:unknown):"en"|"es"|"fr"=>value==="es"||value==="fr"?value:"en";
const invitationCopy={
 en:{subject:"Your ReliefBridge demonstration access",title:"Your ReliefBridge demonstration is ready",hello:"Hello",intro:"A temporary, read-only ReliefBridge demonstration workspace has been prepared for",login:"Login",password:"Temporary password",expires:"Access expires",open:"Open ReliefBridge",disclaimer:"This workspace contains demonstration data only. If you have questions about your access, reply to this email."},
 es:{subject:"Acceso a su demostración de ReliefBridge",title:"Su demostración de ReliefBridge está lista",hello:"Hola",intro:"Hemos preparado un espacio de demostración temporal de ReliefBridge, de solo lectura, para",login:"Correo de acceso",password:"Contraseña temporal",expires:"El acceso vence",open:"Abrir ReliefBridge",disclaimer:"Este espacio contiene únicamente datos de demostración. Si tiene preguntas sobre su acceso, responda a este correo."},
 fr:{subject:"Accès à votre démonstration ReliefBridge",title:"Votre démonstration ReliefBridge est prête",hello:"Bonjour",intro:"Un espace de démonstration ReliefBridge temporaire, en lecture seule, a été préparé pour",login:"Identifiant",password:"Mot de passe temporaire",expires:"Expiration de l'accès",open:"Ouvrir ReliefBridge",disclaimer:"Cet espace contient uniquement des données de démonstration. Pour toute question, répondez à ce courriel."}
} as const;
const PLATFORM_ORG="9f3cb5cc-aa6f-44cb-8aa9-b0a7bc505142";
const json=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{"content-type":"application/json"}});
const slug=(v:string)=>v.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,40)||"organization";
const validDays=(v:unknown)=>{const n=Number(v??7);return [1,3,7,14,30].includes(n)?n:7};
function password(){const a="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";const b=crypto.getRandomValues(new Uint8Array(20));return Array.from(b,x=>a[x%a.length]).join("")}
const esc=(v:string)=>v.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]!));
async function sendInvitation(to:string,name:string,org:string,login:string,pwd:string,expires:string,locale:"en"|"es"|"fr"){
 const key=Deno.env.get("RESEND_API_KEY"); if(!key) throw new Error("ReliefBridge email service is not configured.");
 const copy=invitationCopy[locale];
 const greeting=name?esc(name):(locale==="es"?"estimado usuario":locale==="fr"?"cher utilisateur":"there"),orgName=esc(org),loginSafe=esc(login),pwdSafe=esc(pwd);
 const expiresText=new Date(expires).toLocaleString(locale==="es"?"es-PR":locale==="fr"?"fr-CA":"en-US",{dateStyle:"long",timeStyle:"short",timeZone:"America/New_York"})+" ET";
 const res=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({
   from:"ReliefBridge <contact@reliefbridge.net>",to:[to],reply_to:"contact@reliefbridge.net",
   subject:copy.subject,
   html:`<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#172033"><h2 style="color:#12385b">${esc(copy.title)}</h2><p>${esc(copy.hello)} ${greeting},</p><p>${esc(copy.intro)} <strong>${orgName}</strong>.</p><div style="background:#f5f7fa;border:1px solid #dde4ec;border-radius:8px;padding:18px"><p><strong>${esc(copy.login)}:</strong><br>${loginSafe}</p><p><strong>${esc(copy.password)}:</strong><br>${pwdSafe}</p><p><strong>${esc(copy.expires)}:</strong><br>${esc(expiresText)}</p></div><p><a href="https://reliefbridge.net/login?lang=${locale}" style="display:inline-block;background:#12385b;color:white;text-decoration:none;padding:11px 18px;border-radius:5px;font-weight:bold">${esc(copy.open)}</a></p><p>${esc(copy.disclaimer)}</p><p>ReliefBridge</p></div>`,
   text:`${copy.hello} ${name||(locale==="es"?"estimado usuario":locale==="fr"?"cher utilisateur":"there")},\n\n${copy.intro} ${org}.\n\n${copy.login}: ${login}\n${copy.password}: ${pwd}\n${copy.expires}: ${expiresText}\n\n${copy.open}: https://reliefbridge.net/login?lang=${locale}\n\n${copy.disclaimer}\n\nReliefBridge`
 })});
 const result=await res.json().catch(()=>({}));
 if(!res.ok) throw new Error(String(result?.message||"Invitation email could not be sent."));
 return String(result?.id||"");
}
Deno.serve(async(req)=>{
 if(req.method!=="POST")return json({error:"Method not allowed"},405);
 const url=Deno.env.get("SUPABASE_URL")!,anon=Deno.env.get("SUPABASE_ANON_KEY")!,service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,authorization=req.headers.get("Authorization");
 if(!authorization)return json({error:"Unauthorized"},401);
 const caller=createClient(url,anon,{global:{headers:{Authorization:authorization}}});
 const {data:{user}}=await caller.auth.getUser(); if(!user)return json({error:"Unauthorized"},401);
 const {data:profile}=await caller.from("profiles").select("organization_id,role").eq("id",user.id).maybeSingle();
 if(profile?.organization_id!==PLATFORM_ORG||!["owner","admin"].includes(String(profile?.role??"").toLowerCase()))return json({error:"Forbidden"},403);
 const admin=createClient(url,service,{auth:{autoRefreshToken:false,persistSession:false}});
 const body=await req.json(),action=String(body.action??"");
 if(action==="create"){
  const organizationName=String(body.organization_name??"").trim(),organizationType=String(body.organization_type??"VOAD").trim(),city=String(body.city??"").trim(),state=String(body.state??"").trim(),country=String(body.country??"United States").trim(),contactName=String(body.contact_name??"").trim(),contactEmail=String(body.contact_email??"").trim().toLowerCase(),durationDays=validDays(body.duration_days),preferredLocale=validLocale(body.preferred_locale);
  if(!organizationName||!country||country.length>100||!state||state.length>100||!city||city.length>100)return json({error:"Organization name, country, state/province, and city are required."},400);
  if(!contactName||!contactEmail||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail))return json({error:"Client contact and a valid contact email are required so ReliefBridge can deliver the demo invitation."},400);
  const loginEmail=`demo+${slug(organizationName)}-${crypto.randomUUID().slice(0,8)}@reliefbridge.net`,generatedPassword=password();
  const {data:created,error:createError}=await admin.auth.admin.createUser({email:loginEmail,password:generatedPassword,email_confirm:true,user_metadata:{first_name:"Demo",last_name:"User"}});
  if(createError||!created.user)return json({error:createError?.message??"Could not create demo user."},400);
  const userId=created.user.id;
  const workspaceBase=/\bdemo\b/i.test(organizationName)?`${organizationName} Workspace`:`${organizationName} Demo Workspace`;
  const workspaceName=`${workspaceBase} [${crypto.randomUUID().slice(0,8)}]`;
  const {data:org,error:orgError}=await admin.from("organizations").insert({name:workspaceName,organization_type:organizationType,city,state,country,email:"contact@reliefbridge.net",status:"active"}).select("id").single();
  if(orgError||!org){await admin.auth.admin.deleteUser(userId);return json({error:orgError?.message??"Could not create organization."},400)}
  const parts=contactName.split(/\s+/).filter(Boolean),firstName=parts[0]||"Demo",lastName=parts.slice(1).join(" ")||"User";
  const {error:profileError}=await admin.from("profiles").insert({id:userId,organization_id:org.id,full_name:contactName,role:"Viewer",first_name:firstName,last_name:lastName});
  if(profileError){await admin.from("organizations").delete().eq("id",org.id);await admin.auth.admin.deleteUser(userId);return json({error:profileError.message},400)}
  const expiresAt=new Date(Date.now()+durationDays*86400000).toISOString();
  const {data:registry,error:registryError}=await admin.from("demo_workspaces").insert({organization_id:org.id,auth_user_id:userId,request_id:body.request_id||null,contact_name:contactName,contact_email:contactEmail,login_email:loginEmail,status:"active",expires_at:expiresAt,created_by:user.id,invitation_status:"not_sent",preferred_locale:preferredLocale}).select("id").single();
  if(registryError||!registry){await admin.from("profiles").delete().eq("id",userId);await admin.from("organizations").delete().eq("id",org.id);await admin.auth.admin.deleteUser(userId);return json({error:registryError?.message??"Could not register demo."},400)}
  const {error:seedError}=await caller.rpc("seed_managed_demo_workspace",{target_org:org.id});
  if(seedError){await admin.from("demo_workspaces").delete().eq("organization_id",org.id);await admin.from("profiles").delete().eq("id",userId);await admin.from("organizations").delete().eq("id",org.id);await admin.auth.admin.deleteUser(userId);return json({error:"Demo workspace could not be seeded."},500)}
  try{
   const providerId=await sendInvitation(contactEmail,contactName,organizationName,loginEmail,generatedPassword,expiresAt,preferredLocale);
   await admin.from("demo_workspaces").update({invitation_status:"sent",invitation_sent_at:new Date().toISOString(),invitation_error:null,invitation_provider_id:providerId}).eq("id",registry.id);
   return json({login_email:loginEmail,password:generatedPassword,expires_at:expiresAt,organization_id:org.id,preferred_locale:preferredLocale,invitation_status:"sent"});
  }catch(e){
   const message=e instanceof Error?e.message:"Invitation email could not be sent.";
   await admin.from("demo_workspaces").update({invitation_status:"failed",invitation_error:message}).eq("id",registry.id);
   return json({login_email:loginEmail,password:generatedPassword,expires_at:expiresAt,organization_id:org.id,preferred_locale:preferredLocale,invitation_status:"failed",invitation_error:message});
  }
 }
 const demoId=String(body.demo_id??""); const {data:demo}=await admin.from("demo_workspaces").select("id,auth_user_id,status,expires_at").eq("id",demoId).maybeSingle(); if(!demo)return json({error:"Demo not found."},404);
 if(action==="reset_password"){const p=password();const {error}=await admin.auth.admin.updateUserById(demo.auth_user_id,{password:p});if(error)return json({error:error.message},400);return json({password:p})}
 if(action==="disable"){const {error}=await admin.from("demo_workspaces").update({status:"disabled"}).eq("id",demo.id);if(error)return json({error:error.message},400);return json({ok:true})}
 if(action==="set_duration"){const days=validDays(body.duration_days),expiresAt=new Date(Date.now()+days*86400000).toISOString();const {error}=await admin.from("demo_workspaces").update({expires_at:expiresAt}).eq("id",demo.id);if(error)return json({error:error.message},400);return json({expires_at:expiresAt})}
 if(action==="extend"){const days=validDays(body.duration_days),base=Math.max(Date.now(),new Date(demo.expires_at).getTime()),expiresAt=new Date(base+days*86400000).toISOString();const {error}=await admin.from("demo_workspaces").update({status:"active",expires_at:expiresAt}).eq("id",demo.id);if(error)return json({error:error.message},400);return json({expires_at:expiresAt})}
 if(action==="reactivate"){const days=validDays(body.duration_days),expiresAt=new Date(Date.now()+days*86400000).toISOString();const {error}=await admin.from("demo_workspaces").update({status:"active",expires_at:expiresAt}).eq("id",demo.id);if(error)return json({error:error.message},400);return json({expires_at:expiresAt})}
 if(action==="archive"){const {error}=await admin.from("demo_workspaces").update({status:"archived"}).eq("id",demo.id);if(error)return json({error:error.message},400);return json({ok:true})}
 return json({error:"Unknown action."},400);
});