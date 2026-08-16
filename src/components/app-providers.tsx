"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CartItem, Product } from "@/types";
import { CartDrawer } from "./cart-drawer";

const STORE_PRODUCTS="nerj-products", STORE_CART="nerj-cart", STORE_FAV="nerj-favorites";
type Store = { products:Product[]; cart:CartItem[]; favorites:string[]; addToCart:(p:Product)=>void; setQty:(id:string,q:number)=>void; remove:(id:string)=>void; toggleFavorite:(id:string)=>void; setProducts:(p:Product[])=>void; cartOpen:boolean; setCartOpen:(v:boolean)=>void };
const Ctx=createContext<Store|null>(null);
export function useStore(){const v=useContext(Ctx);if(!v)throw new Error("Store unavailable");return v}
export function AppProviders({children}:{children:React.ReactNode}){
 const [products,setProductsState]=useState<Product[]>([]),[cart,setCart]=useState<CartItem[]>([]),[favorites,setFavorites]=useState<string[]>([]),[cartOpen,setCartOpen]=useState(false),[ready,setReady]=useState(false);
 useEffect(()=>{try{setProductsState(JSON.parse(localStorage.getItem(STORE_PRODUCTS)||"[]"));setCart(JSON.parse(localStorage.getItem(STORE_CART)||"[]"));setFavorites(JSON.parse(localStorage.getItem(STORE_FAV)||"[]"))}finally{setReady(true)}},[]);
 useEffect(()=>{if(ready)localStorage.setItem(STORE_PRODUCTS,JSON.stringify(products))},[products,ready]);useEffect(()=>{if(ready)localStorage.setItem(STORE_CART,JSON.stringify(cart))},[cart,ready]);useEffect(()=>{if(ready)localStorage.setItem(STORE_FAV,JSON.stringify(favorites))},[favorites,ready]);
 const value=useMemo(()=>({products,cart,favorites,cartOpen,setCartOpen,setProducts:setProductsState,addToCart:(p:Product)=>{setCart(c=>{const x=c.find(i=>i.product.id===p.id);return x?c.map(i=>i.product.id===p.id?{...i,quantity:i.quantity+1}:i):[...c,{product:p,quantity:1}]});setCartOpen(true)},setQty:(id:string,q:number)=>setCart(c=>c.map(i=>i.product.id===id?{...i,quantity:Math.max(1,q)}:i)),remove:(id:string)=>setCart(c=>c.filter(i=>i.product.id!==id)),toggleFavorite:(id:string)=>setFavorites(f=>f.includes(id)?f.filter(x=>x!==id):[...f,id])}),[products,cart,favorites,cartOpen]);
 return <Ctx.Provider value={value}>{children}<CartDrawer/></Ctx.Provider>
}
