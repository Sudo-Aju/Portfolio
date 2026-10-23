    (function(){
      'use strict';
      var videos=[
        {label:'EVENT RECAP',title:'Media Fellowship',kind:'Landscape · Event film',role:'VIDEO EDITOR',color:'#f2774e',ink:'#14213d',align:'left',left:'13%',tilt:'-.35deg',id:'10ySduVzDH6RYMdHHvcWoVS4L1gQc0HqV'},
        {label:'SPORTS STORY',title:'LeBron James',kind:'Landscape · Scoring streak',role:'VIDEO EDITOR',color:'#8eb9b1',ink:'#eff7f4',align:'right',left:'62%',tilt:'.5deg',id:'1q1VV-F7mUxnO2W6uWLax2YDre6PziBuy'},
        {label:'TRAVEL FILM',title:'China 26',kind:'Landscape · Travel film',role:'VIDEO EDITOR',color:'#e74b70',ink:'#ffe45e',align:'left',left:'8%',tilt:'-.45deg',id:'1ibo3rv1WAPuN1Ux-7-Iti6AQkYj69wkL'},
        {label:'PUBLIC HEALTH',title:'Food Safety',kind:'Landscape · Documentary',role:'DOCUMENTARY EDITOR',color:'#d8bd54',ink:'#171b35',align:'right',left:'48%',tilt:'.3deg',id:'1PLP6V4JySb6vgd33YxRvhE-OxKnHH191'},
        {label:'GAMEPLAY',title:'Pixel Game Edit',kind:'Landscape · Short-form edit',role:'VIDEO EDITOR',color:'#869ce0',ink:'#172144',align:'left',left:'20%',tilt:'-.5deg',id:'14ZQ4wza5YDiemBx-RShKEjQMvlniD6GS'},
        {label:'APP FEATURE',title:'App Store Game',kind:'Landscape · App feature',role:'PROMO EDITOR',color:'#b4c844',ink:'#18213b',align:'right',left:'70%',tilt:'.35deg',id:'1W2sIbTseAnb5rGRBspzdrB4rfA0kbbnU'},
        {label:'HACKATHON',title:'Blueprint',kind:'Landscape · Event recap',role:'EVENT FILM',color:'#a3b8b5',ink:'#dc4169',align:'left',left:'12%',tilt:'-.25deg',id:'1lr3HuiNOX2ZU32euN7efxR2xIDaUTm_A'},
        {label:'STUDENT STORIES',title:'Student President',kind:'Landscape · Interview + campaign',role:'INTERVIEW + CAMPAIGN',color:'#efa0bd',ink:'#f8f2ed',align:'right',left:'55%',tilt:'.45deg',projects:[{name:'Interview',id:'1U8APboNqh3vYataiYvO5SlaUZJo65C9J'},{name:'Campaign Film',id:'1DBYXo410qf5j1CFt6MweqJK58PEIF6Xd'}]},
        {label:'CREATOR REEL',title:'Creator Short',kind:'Portrait · Social edit',role:'SOCIAL VIDEO EDITOR',color:'#e8c846',ink:'#19213b',align:'left',left:'22%',tilt:'-.4deg',id:'1SvTDTNfvj9ZPZei5A6a3EfQygGjhpCeL'},
        {label:'CAMPUS LIFE',title:'Student Listings',kind:'Portrait · Creator reel',role:'CREATOR REEL',color:'#75b7a6',ink:'#f6f1e9',align:'right',left:'65%',tilt:'.4deg',id:'1wm-uoZmwNY9_E2Gj0H15r9sVEksWVxUD'},
        {label:'EXPLAINER',title:'Episode 1501',kind:'Portrait · Nutrition explainer',role:'EXPLAINER EDITOR',color:'#f07950',ink:'#17213a',align:'left',left:'14%',tilt:'-.35deg',id:'14Ipzvtq9mClI1nhoNhwq7EFO_UqDs8IO'},
        {label:'APPAREL PROMO',title:'Apparel Drop',kind:'Portrait · Brand reel',role:'BRAND PROMO',color:'#d94870',ink:'#ffe36b',align:'right',left:'52%',tilt:'.45deg',id:'1_kfG0LfsIJ-dUv9dy-PPpxQBcNICuu6n'},
        {label:'PRODUCT REEL',title:'Roopkala Facepack',kind:'Portrait · Product film',role:'PRODUCT FILM',color:'#c1b5a8',ink:'#671732',align:'left',left:'11%',tilt:'-.3deg',id:'1F5toKQssor8GndCdM4VOlaoqpx8MV5qN'}
      ];
      var stack=document.getElementById('dividerStack');
      var slots=[];
      var active=-1;
      var totalHeight=0;
      var textureFiles=['carton-1.jpg','carton-2.jpg','carton-3.jpg','carton-4.jpg'];
      function textureAsset(index){return new URL('assets/img/'+textureFiles[index%textureFiles.length],document.baseURI).href;}
      var weights=[1.1,1.35,.8,1.2,.9,1.15,.85];
      var isMobile=function(){return window.matchMedia('(max-width: 860px)').matches};
      function frame(id,title){
        var iframe=document.createElement('iframe');
        iframe.src='https://drive.google.com/file/d/'+id+'/preview';
        iframe.title=title;
        iframe.loading='lazy';
        iframe.allow='autoplay; fullscreen; picture-in-picture';
        iframe.allowFullscreen=true;
        iframe.referrerPolicy='strict-origin-when-cross-origin';
        return iframe;
      }
      function cacheClosedTitleMetrics(slot){
        if(!slot||slot.titlePinned||!slot.title.isConnected)return;
        var rect=slot.title.getBoundingClientRect(),clipRect=slot.clip.getBoundingClientRect(),style=getComputedStyle(slot.title);
        slot.closedTitleMetrics={top:rect.top-clipRect.top,left:rect.left-clipRect.left,fontFamily:style.fontFamily,fontSize:style.fontSize,fontWeight:style.fontWeight,lineHeight:style.lineHeight,letterSpacing:style.letterSpacing,textTransform:style.textTransform,color:style.color};
      }
      function cacheAllClosedTitleMetrics(){if(active===-1)slots.forEach(cacheClosedTitleMetrics);}
      function pinTitle(slot){
        if(!slot||slot.titlePinned)return;
        if(!slot.closedTitleMetrics)cacheClosedTitleMetrics(slot);
        var title=slot.title,metrics=slot.closedTitleMetrics;
        slot.titleOriginalStyle=title.getAttribute('style');
        slot.titlePinned=true;
        title.style.position='absolute';title.style.zIndex='1';title.style.top=metrics.top+'px';title.style.left=metrics.left+'px';title.style.right='auto';title.style.bottom='auto';
        title.style.display='inline-block';title.style.width='max-content';title.style.maxWidth='none';title.style.transform='none';title.style.margin='0';
        title.style.fontFamily=metrics.fontFamily;title.style.fontSize=metrics.fontSize;title.style.fontWeight=metrics.fontWeight;title.style.lineHeight=metrics.lineHeight;title.style.letterSpacing=metrics.letterSpacing;title.style.textTransform=metrics.textTransform;title.style.color=metrics.color;
        title.style.whiteSpace='nowrap';title.style.overflow='visible';title.style.textOverflow='clip';title.style.textShadow='none';title.style.transition='none';title.style.pointerEvents='none';
        slot.clip.appendChild(title);
      }
      function unpinTitle(slot){
        if(!slot||!slot.titlePinned)return;
        slot.button.insertBefore(slot.title,slot.index);
        if(slot.titleOriginalStyle===null)slot.title.removeAttribute('style');else slot.title.setAttribute('style',slot.titleOriginalStyle);
        slot.titlePinned=false;slot.titleOriginalStyle=null;
      }
      function scheduleWindowFade(slot,index){
        if(slot.frameFadeTimer){clearTimeout(slot.frameFadeTimer);slot.frameFadeTimer=0;}
        if(!slot.panel)return;
        slot.panel.classList.remove('is-visible');
        slot.frameFadeTimer=setTimeout(function(){
          slot.frameFadeTimer=0;
          if(active===index&&slot.el.classList.contains('is-open')&&slot.panel)slot.panel.classList.add('is-visible');
        },500);
      }
      function clearSlotContent(slot){
        if(slot.closeTimer){clearTimeout(slot.closeTimer);slot.closeTimer=0;}
        if(slot.frameFadeTimer){clearTimeout(slot.frameFadeTimer);slot.frameFadeTimer=0;}
        unpinTitle(slot);slot.el.classList.remove('is-closing');slot.clip.replaceChildren();slot.content=null;slot.player=null;slot.panel=null;slot.tabs=null;
      }
      function setOpen(index){
        var previous=active;
        var next=active===index?-1:index;
        if(previous!==-1&&next!==-1&&previous!==next)unpinTitle(slots[previous]);
        if(next!==-1)pinTitle(slots[next]);
        active=next;
        stack.classList.toggle('has-open',active!==-1);
        measure();
        slots.forEach(function(slot,i){
          var opened=i===active;
          slot.el.classList.toggle('is-open',opened);
          if(opened){slot.el.classList.remove('is-closing');if(slot.closeTimer){clearTimeout(slot.closeTimer);slot.closeTimer=0;}}
          slot.button.setAttribute('aria-expanded',opened?'true':'false');
          slot.el.style.flexGrow=active===-1?String(weights[i%weights.length]):(opened?(isMobile()?String(Math.max(1,totalHeight-(videos.length-1)*Math.max(10,Math.min(22,totalHeight*.12/(videos.length-1))))):'80'):String(isMobile()?Math.max(10,Math.min(22,totalHeight*.12/(videos.length-1))):20/(videos.length-1)));
          slot.el.style.order=isMobile()?(opened?'1':'0'):'';
          slot.el.style.zIndex=opened?String(videos.length+10):String(i+1);
          if(!opened){
            if(i===previous&&slot.content){
              if(slot.frameFadeTimer){clearTimeout(slot.frameFadeTimer);slot.frameFadeTimer=0;}
              slot.el.classList.add('is-closing');
              if(slot.closeTimer)clearTimeout(slot.closeTimer);
              slot.closeTimer=setTimeout(function(){if(active!==i&&slot.el.classList.contains('is-closing'))clearSlotContent(slot);},600);
            }else if(!slot.el.classList.contains('is-closing'))clearSlotContent(slot);
            return;
          }
          if(slot.content){scheduleWindowFade(slot,i);return;}
          var close=document.createElement('button');
          close.className='band-close';close.type='button';close.textContent='×';close.setAttribute('aria-label','Close video preview');
          close.addEventListener('click',function(e){e.stopPropagation();setOpen(i);});
          var content=document.createElement('div');content.className='band-content';
          var panel=document.createElement('div');panel.className='video-panel';panel.style.setProperty('--panel-ink',slot.data.ink);panel.style.setProperty('--band',slot.data.color);panel.style.setProperty('--texture','url("'+textureAsset(i)+'")');
          var projects=slot.data.projects||[{name:slot.data.title,id:slot.data.id}];
          var tabs=null;
          if(projects.length>1){
            tabs=document.createElement('div');tabs.className='project-tabs';tabs.setAttribute('role','tablist');
            projects.forEach(function(project,j){
              var tab=document.createElement('button');tab.className='project-tab';tab.type='button';tab.textContent=project.name;tab.setAttribute('role','tab');tab.setAttribute('aria-selected',j===0?'true':'false');tab.style.setProperty('--tab-radius',slot.data.tabRadius||'10px 10px 0 0');tab.style.color=slot.data.ink;tab.style.backgroundImage='linear-gradient('+slot.data.color+','+slot.data.color+'),url("'+textureAsset(i)+'")';tab.style.backgroundSize='100% 100%,170px 170px';tab.style.backgroundBlendMode='color,normal';
              tab.addEventListener('click',function(e){e.stopPropagation();tabs.querySelectorAll('.project-tab').forEach(function(other){other.setAttribute('aria-selected','false');});tab.setAttribute('aria-selected','true');player.replaceChildren(frame(project.id,slot.data.title+' — '+project.name));});
              tabs.appendChild(tab);
            });
          }
          var player=document.createElement('div');player.className='video-frame';player.appendChild(frame(projects[0].id,slot.data.title));panel.appendChild(player);
          var role=document.createElement('p');role.className='video-role';role.textContent=slot.data.role||slot.data.kind;panel.appendChild(role);
          if(tabs)content.append(tabs);content.append(panel);slot.clip.replaceChildren(slot.title,content,close);slot.content=content;slot.player=player;slot.panel=panel;slot.tabs=tabs;scheduleWindowFade(slot,i);
          requestAnimationFrame(function(){fitPlayer(slot);});
        });
        if(active!==-1&&isMobile())slots[active].el.scrollIntoView({behavior:'smooth',block:'end'});
      }
      var tabShapes=['10px 10px 0 0','4px 24px 0 0','24px 4px 0 0','16px 16px 0 0'];
      videos.forEach(function(data,i){
        var slot=document.createElement('article');slot.className='band-slot';
        var button=document.createElement('button');button.className='band-sheet';button.type='button';button.setAttribute('aria-expanded','false');button.setAttribute('aria-label','Open '+data.title+' video preview');
        button.style.setProperty('--band',data.color);button.style.setProperty('--title-ink',data.ink);button.style.setProperty('--tab-ink',data.ink);button.style.setProperty('--tab-left',data.left);button.style.setProperty('--tab-radius',tabShapes[i%tabShapes.length]);button.style.setProperty('--tilt',data.tilt);button.style.setProperty('--texture','url("'+textureAsset(i)+'")');
        var tab=document.createElement('button');tab.className='band-tab';tab.type='button';tab.textContent=data.label;tab.setAttribute('aria-label','Open '+data.title+' video preview');tab.style.setProperty('--band',data.color);tab.style.setProperty('--title-ink',data.ink);tab.style.setProperty('--tab-ink',data.ink);tab.style.setProperty('--tab-left',data.left);tab.style.setProperty('--tab-radius',tabShapes[i%tabShapes.length]);tab.style.setProperty('--tilt',data.tilt);tab.style.setProperty('--texture','url("'+textureAsset(i)+'")');tab.addEventListener('click',function(){setOpen(i);});
        var title=document.createElement('span');title.className='band-title '+(data.align==='right'?'right':'');title.textContent=data.title;
        var index=document.createElement('span');index.className='band-index';index.textContent=String(i+1).padStart(2,'0');
        button.append(title,index);
        var clip=document.createElement('div');clip.className='band-clip';
        button.addEventListener('click',function(){setOpen(i);});
        slot.append(button,tab,clip);stack.appendChild(slot);slots.push({el:slot,button:button,clip:clip,title:title,index:index,data:data,content:null,closeTimer:0,frameFadeTimer:0,titlePinned:false,titleOriginalStyle:null,closedTitleMetrics:null});
        slot.addEventListener('transitionend',function(event){if(event.target!==slot)return;if(slot.classList.contains('is-closing')&&active!==i)clearSlotContent(slots[i]);if(active===i)fitPlayer(slots[i]);});
      });
      requestAnimationFrame(cacheAllClosedTitleMetrics);
      if(document.fonts&&document.fonts.ready)document.fonts.ready.then(cacheAllClosedTitleMetrics);
      function fitPlayer(slot){
        if(!slot||!slot.player||!slot.panel||!slot.content)return;
        var frameEl=slot.player,panel=slot.panel,content=slot.content;
        var panelStyle=getComputedStyle(panel),contentStyle=getComputedStyle(content);
        var px=parseFloat(panelStyle.paddingLeft)+parseFloat(panelStyle.paddingRight)+parseFloat(panelStyle.borderLeftWidth)+parseFloat(panelStyle.borderRightWidth);
        var py=parseFloat(panelStyle.paddingTop)+parseFloat(panelStyle.paddingBottom)+parseFloat(panelStyle.borderTopWidth)+parseFloat(panelStyle.borderBottomWidth);
        if(isMobile()){
          var mobileW=Math.max(140,panel.clientWidth-px);
          frameEl.style.width=mobileW+'px';frameEl.style.height=(mobileW*9/16)+'px';
          return;
        }
        var reserved=(slot.tabs?slot.tabs.getBoundingClientRect().height-6:0)+py+34;
        var maxH=Math.max(90,slot.el.getBoundingClientRect().height-parseFloat(contentStyle.paddingTop)-parseFloat(contentStyle.paddingBottom)-reserved);
        var maxW=Math.max(160,Math.min(content.clientWidth-parseFloat(contentStyle.paddingLeft)-parseFloat(contentStyle.paddingRight)-px,window.innerWidth*.68));
        var w=Math.min(maxW,maxH*16/9);frameEl.style.width=w+'px';frameEl.style.height=(w*9/16)+'px';
        panel.style.width=(w+px)+'px';
      }
      function measure(){
        var available=Math.max(window.innerHeight-150,500);
        totalHeight=active!==-1?available:(videos.length<=10?available:available+(videos.length-10)*available/10);
        stack.style.height=totalHeight+'px';
        if(active!==-1){
          var closed=isMobile()?Math.max(10,Math.min(22,totalHeight*.12/(videos.length-1))):null;
          slots.forEach(function(slot,i){slot.el.style.flexGrow=i===active?(isMobile()?String(Math.max(1,totalHeight-(videos.length-1)*closed)):'80'):(isMobile()?String(closed):String(20/(videos.length-1)));slot.el.style.order=isMobile()?(i===active?'1':'0'):'';slot.el.style.zIndex=i===active?String(videos.length+10):String(i+1);});
        }else{slots.forEach(function(slot,i){slot.el.style.flexGrow=String(weights[i%weights.length]);slot.el.style.order='';slot.el.style.zIndex=String(i+1);});}
      }
      window.addEventListener('resize',function(){measure();if(active===-1)requestAnimationFrame(cacheAllClosedTitleMetrics);else requestAnimationFrame(function(){fitPlayer(slots[active]);});},{passive:true});
      document.addEventListener('keydown',function(e){if(e.key==='Escape'&&active!==-1)setOpen(active);});
      measure();
    })();
