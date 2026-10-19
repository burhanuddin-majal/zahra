const mood=document.querySelector("#mood");document.querySelectorAll("[data-mood]").forEach(b=>b.addEventListener("click",()=>mood.textContent=b.dataset.mood+" — every feeling is okay. 💖"));const compliments=["Your imagination is full of magic! ✨","You make the world brighter by being you. 🌈","Your kindness is a superpower. 💗","You can learn new things one little step at a time. 🌷","Your ideas deserve room to grow. 🌱","You are wonderfully, uniquely you. 🦋"];document.querySelector("#compliment").addEventListener("click",()=>document.querySelector("#compliment-result").textContent=compliments[Math.floor(Math.random()*compliments.length)]);const ideas=["Draw a unicorn having a picnic on the moon. 🦄","Invent a new flower with rainbow petals. 🌸","Design a cosy treehouse for tiny fairies. 🏡","Create a friendly monster who loves cupcakes. 🧁","Draw your dream garden with a butterfly pond. 🦋"];document.querySelector("#idea").addEventListener("click",()=>document.querySelector("#idea-result").textContent=ideas[Math.floor(Math.random()*ideas.length)]);document.querySelectorAll("[data-kind]").forEach(b=>b.addEventListener("click",()=>document.querySelector("#kindness-result").textContent=b.dataset.kind+" 🌼 One flower planted in your kindness garden!"));document.querySelector("#rules").addEventListener("click",()=>document.querySelector("#rules-result").textContent="Lovely! Ask a trusted grown-up before joining any online chat. 💕");

/* Guardian-approved Supabase chat. Configure these two public project values after a guardian creates the project. */
(() => {
  const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";
  const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
  const byId = id => document.getElementById(id);
  const warning = byId("chat-config-warning"), authArea = byId("auth-area"), room = byId("chat-room"), status = byId("chat-status");
  if (!window.supabase || SUPABASE_URL.includes("YOUR_") || SUPABASE_ANON_KEY.includes("YOUR_")) return;
  warning.hidden = true; authArea.hidden = false;
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  let channel = null;
  const say = message => { status.textContent = message; };
  const safe = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  async function refreshMessages() {
    const { data, error } = await client.from("chat_messages").select("id,content,created_at,profiles(nickname)").order("created_at",{ascending:true}).limit(100);
    if (error) { say("Chat couldn't load. Please ask your grown-up to check the setup."); return; }
    const container = byId("messages"); container.replaceChildren();
    (data || []).forEach(item => {
      const article = document.createElement("article"); article.className = "message";
      const name = document.createElement("strong"); name.textContent = item.profiles?.nickname || "Club member";
      const body = document.createElement("p"); body.textContent = item.content;
      article.append(name,body); container.append(article);
    });
    container.scrollTop = container.scrollHeight;
  }
  async function updateState() {
    const {data:{user}} = await client.auth.getUser();
    if (!user) { authArea.hidden = false; room.hidden = true; return; }
    const {data:profile,error} = await client.from("profiles").select("nickname,approved").eq("id",user.id).maybeSingle();
    if (error || !profile) { say("Your profile isn't ready yet. Ask your grown-up to check setup."); return; }
    byId("nickname").value = profile.nickname || "";
    authArea.hidden = false;
    if (!profile.approved) { room.hidden = true; say("Your account is waiting for a parent/guardian's approval. 💌"); return; }
    room.hidden = false; say("Welcome to the club. Remember: keep personal details private! 💗");
    await refreshMessages();
    if (channel) await client.removeChannel(channel);
    channel = client.channel("kitty-club-messages").on("postgres_changes",{event:"INSERT",schema:"public",table:"chat_messages"},refreshMessages).subscribe();
  }
  byId("signup").addEventListener("click", async () => {
    const email=byId("email").value.trim(), password=byId("password").value, nickname=byId("nickname").value.trim();
    if (!nickname || !email || password.length < 8) return say("Enter a nickname, email, and password of at least 8 characters.");
    if (/[.@/\\]/.test(nickname) || nickname.length > 24) return say("Please choose a simple nickname without personal details.");
    const {error}=await client.auth.signUp({email,password,options:{data:{nickname}}});
    say(error ? error.message : "Check your email to confirm your account, then sign in. Ask your grown-up to help.");
  });
  byId("login").addEventListener("click", async () => {
    const {error}=await client.auth.signInWithPassword({email:byId("email").value.trim(),password:byId("password").value});
    if(error) return say("Sign-in didn't work. Check your details or ask your grown-up for help.");
    await updateState();
  });
  byId("request-approval").addEventListener("click", async () => {
    const {data:{session}}=await client.auth.getSession();
    if(!session) return say("First create your account and sign in, then request approval.");
    const {error}=await client.functions.invoke("request-access",{body:{nickname:byId("nickname").value.trim()}});
    say(error ? "Couldn't send the approval request. Ask your grown-up to check the setup." : "Approval request sent to your parent/guardian. Please wait for them to approve it.");
  });
  byId("logout").addEventListener("click",async()=>{if(channel) await client.removeChannel(channel);await client.auth.signOut();room.hidden=true;say("You are signed out.");});
  byId("message-form").addEventListener("submit",async event=>{
    event.preventDefault();const content=byId("message").value.trim();if(!content)return;
    if(/\b(my (address|school|phone|password)|i live at|my full name)\b/i.test(content)) return say("For your safety, don't post private details. Try a kind message instead.");
    const {data:{user}}=await client.auth.getUser();if(!user)return say("Please sign in again.");
    const {error}=await client.from("chat_messages").insert({author_id:user.id,content});
    if(error)return say("Message not sent. Please ask your grown-up for help.");
    byId("message").value="";await refreshMessages();say("Message sent 💗");
  });
  client.auth.onAuthStateChange(()=>{setTimeout(updateState,0);});
  updateState();
})();
