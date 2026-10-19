import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const hash = async (token:string) => { const bytes = await crypto.subtle.digest("SHA-256",new TextEncoder().encode(token)); return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,"0")).join(""); };
const page=(title:string,body:string)=>new Response(`<!doctype html><html><meta name="viewport" content="width=device-width"><title>${title}</title><body style="font:16px system-ui;max-width:620px;margin:12vh auto;padding:24px;color:#63445e;background:#fffafd"><h1>${title}</h1><p>${body}</p><p>You can close this page now.</p></body></html>`,{headers:{"Content-Type":"text/html; charset=utf-8"}});
Deno.serve(async req=>{
 if(req.method!=="GET") return page("Invalid link","Please open the approval link from the email.");
 const token=new URL(req.url).searchParams.get("token");
 if(!token||token.length<32) return page("Invalid link","This approval link is missing or invalid.");
 const admin=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
 const {data:request,error}=await admin.from("approval_requests").select("id,user_id,expires_at,used_at").eq("token_hash",await hash(token)).maybeSingle();
 if(error||!request||request.used_at||new Date(request.expires_at)<new Date()) return page("Link expired","This link has expired or has already been used. Ask your child to request a new approval email.");
 const {error:updateError}=await admin.from("profiles").update({approved:true}).eq("id",request.user_id);
 if(updateError) return page("Could not approve","Something went wrong. Please ask your website administrator to check the setup.");
 await admin.from("approval_requests").update({used_at:new Date().toISOString()}).eq("id",request.id);
 return page("Account approved 💗","The account is now approved to enter Kitty Club chat. Please review the safety rules together and supervise chat use.");
});
