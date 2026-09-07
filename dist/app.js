'use strict';
const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');
function closeMenu(){menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Open menu');mobileNav.hidden=true;}
menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')==='true';menuButton.setAttribute('aria-expanded',String(!open));menuButton.setAttribute('aria-label',open?'Open menu':'Close menu');mobileNav.hidden=open;});
mobileNav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!mobileNav.hidden){closeMenu();menuButton.focus();}});
window.matchMedia('(min-width:1101px)').addEventListener('change',e=>{if(e.matches)closeMenu();});

const speakers=JSON.parse(document.querySelector('#speaker-data').textContent);
const dialog=document.querySelector('#session-dialog');
let lastTrigger=null;
function openSession(index,trigger){
  const speaker=speakers[index];if(!speaker)return;
  lastTrigger=trigger;
  document.querySelector('#dialog-image').src=speaker.image;
  document.querySelector('#dialog-image').alt=speaker.name;
  document.querySelector('#dialog-type').textContent=speaker.type;
  document.querySelector('#dialog-name').textContent=speaker.name;
  document.querySelector('#dialog-role').textContent=speaker.role;
  document.querySelector('#dialog-profile').href=speaker.profile;
  document.querySelector('#dialog-title').textContent=speaker.title;
  const synopsis=document.querySelector('#dialog-synopsis');synopsis.replaceChildren();
  speaker.synopsis.forEach(text=>{const p=document.createElement('p');p.textContent=text;synopsis.append(p);});
  dialog.showModal();dialog.scrollTop=0;document.body.classList.add('dialog-open');
}
document.querySelectorAll('[data-session]').forEach(button=>button.addEventListener('click',()=>openSession(Number(button.dataset.session),button)));
document.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();});
dialog.addEventListener('close',()=>{document.body.classList.remove('dialog-open');lastTrigger?.focus();});
const ticketBar=document.querySelector('.mobile-ticket-bar');
const heroObserver=new IntersectionObserver(([entry])=>ticketBar.classList.toggle('visible',!entry.isIntersecting),{threshold:0});
heroObserver.observe(document.querySelector('.hero'));
