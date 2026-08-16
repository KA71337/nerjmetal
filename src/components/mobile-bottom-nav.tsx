"use client";
import Link from "next/link";
import {Heart,Home,LayoutGrid,ShoppingBag} from "lucide-react";
import {usePathname} from "next/navigation";
import {useStore} from "./app-providers";

export function MobileBottomNav(){
 const path=usePathname();const {cart,favorites,setCartOpen}=useStore();
 const items=[{href:"/",label:"Ana",Icon:Home,active:path==="/"},{href:"/catalog",label:"Məhsullar",Icon:LayoutGrid,active:path.startsWith("/catalog")},{href:"/favorites",label:"Seçilmiş",Icon:Heart,active:path==="/favorites",count:favorites.length}];
 return <nav className="mobile-bottom-nav" aria-label="Mobil əsas naviqasiya">{items.map(({href,label,Icon,active,count})=><Link key={href} href={href} aria-current={active?"page":undefined} className={active?"is-active":""}><span className="relative"><Icon size={21}/>{!!count&&<b>{count}</b>}</span><span>{label}</span></Link>)}<button onClick={()=>setCartOpen(true)}><span className="relative"><ShoppingBag size={21}/>{cart.length>0&&<b>{cart.reduce((n,x)=>n+x.quantity,0)}</b>}</span><span>Səbət</span></button></nav>
}
