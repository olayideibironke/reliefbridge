import Link from "next/link";
import { Icons } from "@/components/ui/Icons";

export function TopBar({orgName,isPlatformAdmin=false}:{orgName:string;isPlatformAdmin?:boolean}){
 return <header className="sticky top-0 z-10 border-b border-line bg-surface/90 backdrop-blur"><div className="flex h-16 items-center gap-4 px-6 md:px-10">
  <div className="hidden items-center gap-2 text-[12.5px] text-ink-3 md:flex"><Icons.Building className="h-4 w-4"/><span className="font-medium text-ink-2">{isPlatformAdmin?"ReliefBridge Platform Administration":orgName}</span></div>
  <div className="ml-auto flex-1 md:ml-6"/>
  <div className="flex items-center gap-2"><Link href={isPlatformAdmin?"/app/platform/activity":"/app/reports"} className="hidden h-10 items-center gap-2 rounded-sm border border-line bg-surface px-3 text-[12.5px] font-semibold text-ink-2 hover:no-underline md:inline-flex"><Icons.Reports className="h-4 w-4"/>{isPlatformAdmin?"Activity Log":"Reports"}</Link></div>
 </div></header>
}