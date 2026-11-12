/* Gerador de Pix (BR Code estático) e de QR Code, sem bibliotecas. */
const CRC16=s=>{let c=0xFFFF;for(let i=0;i<s.length;i++){c^=s.charCodeAt(i)<<8;for(let j=0;j<8;j++)c=(c&0x8000)?((c<<1)^0x1021)&0xFFFF:(c<<1)&0xFFFF}return c.toString(16).toUpperCase().padStart(4,"0")};
const tlv=(id,v)=>id+String(v.length).padStart(2,"0")+v;
function pixPayload(o){
  const clean=(s,n)=>(String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^A-Za-z0-9 .\-]/g,"").toUpperCase().trim().slice(0,n))||"NA";
  let mai=tlv("00","BR.GOV.BCB.PIX")+tlv("01",String(o.chave).trim());
  if(o.descricao)mai+=tlv("02",clean(o.descricao,40));
  const p=tlv("00","01")+tlv("01","11")+tlv("26",mai)+tlv("52","0000")+tlv("53","986")+(o.valor?tlv("54",Number(o.valor).toFixed(2)):"")+tlv("58","BR")+tlv("59",clean(o.nome,25))+tlv("60",clean(o.cidade,15))+tlv("62",tlv("05",o.txid||"***"))+"6304";
  return p+CRC16(p);
}
const QR=(()=>{
  const ECC=[10,16,26,18,24,16,18,22,22,26,30,22,22,24,24],BLK=[1,1,1,2,2,4,4,4,5,5,5,8,9,9,10]; /* nível M, versões 1 a 15 */
  const raw=v=>{let r=(16*v+128)*v+64;if(v>=2){const n=Math.floor(v/7)+2;r-=(25*n-10)*n-55;if(v>=7)r-=36}return r};
  const dataCw=v=>Math.floor(raw(v)/8)-ECC[v-1]*BLK[v-1];
  const EXP=new Array(512),LOG=new Array(256);let x=1;for(let i=0;i<255;i++){EXP[i]=x;LOG[x]=i;x<<=1;if(x&256)x^=0x11D}for(let i=255;i<512;i++)EXP[i]=EXP[i-255];
  const mul=(a,b)=>a&&b?EXP[LOG[a]+LOG[b]]:0;
  function gen(d){let r=[1];for(let i=0;i<d;i++){const n=new Array(r.length+1).fill(0);for(let j=0;j<r.length;j++){n[j]^=r[j];n[j+1]^=mul(r[j],EXP[i])}r=n}return r}
  function rem(data,g){const d=g.length-1,r=new Array(d).fill(0);for(const b of data){const f=b^r[0];r.shift();r.push(0);for(let i=0;i<d;i++)r[i]^=mul(g[i+1],f)}return r}
  const alignPos=v=>{if(v===1)return[];const n=Math.floor(v/7)+2,st=v===32?26:Math.ceil((v*4+4)/(n*2-2))*2,r=[6];for(let p=v*4+10;r.length<n;p-=st)r.splice(1,0,p);return r};
  function make(text){
    const by=[...new TextEncoder().encode(text)];let v=1;
    for(;v<=15;v++){if(4+(v<10?8:16)+by.length*8<=dataCw(v)*8)break}
    if(v>15)throw new Error("Texto grande demais para o QR Code");
    const bits=[],put=(val,n)=>{for(let i=n-1;i>=0;i--)bits.push((val>>>i)&1)};
    put(4,4);put(by.length,v<10?8:16);by.forEach(b=>put(b,8));
    const cap=dataCw(v)*8;put(0,Math.min(4,cap-bits.length));while(bits.length%8)bits.push(0);for(let pad=0xEC;bits.length<cap;pad^=0xEC^0x11)put(pad,8);
    const data=[];for(let i=0;i<bits.length;i+=8)data.push(parseInt(bits.slice(i,i+8).join(""),2));
    const nb=BLK[v-1],el=ECC[v-1],rw=Math.floor(raw(v)/8),ns=nb-rw%nb,sl=Math.floor(rw/nb),g=gen(el),bl=[];let k=0;
    for(let i=0;i<nb;i++){const dl=sl-el+(i<ns?0:1),d=data.slice(k,k+dl);k+=dl;bl.push({d,e:rem(d,g)})}
    const all=[];for(let i=0;i<=sl-el;i++)bl.forEach(b=>{if(i<b.d.length)all.push(b.d[i])});for(let i=0;i<el;i++)bl.forEach(b=>all.push(b.e[i]));
    const size=v*4+17,M=Array.from({length:size},()=>new Array(size).fill(false)),F=Array.from({length:size},()=>new Array(size).fill(false));
    const set=(x,y,d)=>{if(x>=0&&x<size&&y>=0&&y<size){M[y][x]=d;F[y][x]=true}};
    for(let i=0;i<size;i++){set(6,i,i%2===0);set(i,6,i%2===0)}
    const finder=(cx,cy)=>{for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){const d=Math.max(Math.abs(dx),Math.abs(dy));set(cx+dx,cy+dy,d!==2&&d!==4)}};
    finder(3,3);finder(size-4,3);finder(3,size-4);
    const ap=alignPos(v),na=ap.length;
    for(let i=0;i<na;i++)for(let j=0;j<na;j++){if((i===0&&j===0)||(i===0&&j===na-1)||(i===na-1&&j===0))continue;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)set(ap[i]+dx,ap[j]+dy,Math.max(Math.abs(dx),Math.abs(dy))!==1)}
    const fmt=m=>{const d=m;let r=d;for(let i=0;i<10;i++)r=(r<<1)^((r>>>9)*0x537);const b=((d<<10)|r)^0x5412,bit=i=>((b>>>i)&1)!==0;
      for(let i=0;i<=5;i++)set(8,i,bit(i));set(8,7,bit(6));set(8,8,bit(7));set(7,8,bit(8));for(let i=9;i<15;i++)set(14-i,8,bit(i));
      for(let i=0;i<8;i++)set(size-1-i,8,bit(i));for(let i=8;i<15;i++)set(8,size-15+i,bit(i));set(8,size-8,true)};
    fmt(0);
    if(v>=7){let r=v;for(let i=0;i<12;i++)r=(r<<1)^((r>>>11)*0x1F25);const b=(v<<12)|r;for(let i=0;i<18;i++){const bt=((b>>>i)&1)!==0,a=size-11+i%3,c=Math.floor(i/3);set(a,c,bt);set(c,a,bt)}}
    let bi=0;for(let right=size-1;right>=1;right-=2){if(right===6)right=5;for(let vert=0;vert<size;vert++)for(let j=0;j<2;j++){const x=right-j,up=((right+1)&2)===0,y=up?size-1-vert:vert;if(!F[y][x]&&bi<all.length*8){M[y][x]=((all[bi>>>3]>>>(7-(bi&7)))&1)!==0;bi++}}}
    const inv=(m,x,y)=>[(x+y)%2===0,y%2===0,x%3===0,(x+y)%3===0,(Math.floor(x/3)+Math.floor(y/2))%2===0,x*y%2+x*y%3===0,(x*y%2+x*y%3)%2===0,((x+y)%2+x*y%3)%2===0][m];
    const mask=m=>{for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(!F[y][x]&&inv(m,x,y))M[y][x]=!M[y][x]};
    const pen=()=>{let p=0;
      for(let t=0;t<2;t++){for(let a=0;a<size;a++){let run=1;for(let b=1;b<size;b++){const c=t?M[b][a]:M[a][b],pr=t?M[b-1][a]:M[a][b-1];if(c===pr){run++;if(run===5)p+=3;else if(run>5)p++}else run=1}}}
      for(let y=0;y<size-1;y++)for(let x=0;x<size-1;x++){const c=M[y][x];if(c===M[y][x+1]&&c===M[y+1][x]&&c===M[y+1][x+1])p+=3}
      const pa=[1,0,1,1,1,0,1,0,0,0,0],pb=[0,0,0,0,1,0,1,1,1,0,1];
      for(let t=0;t<2;t++)for(let a=0;a<size;a++)for(let b=0;b<=size-11;b++){let ma=true,mb=true;for(let k=0;k<11;k++){const c=(t?M[b+k][a]:M[a][b+k])?1:0;if(c!==pa[k])ma=false;if(c!==pb[k])mb=false}if(ma||mb)p+=40}
      let dark=0;for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(M[y][x])dark++;const tot=size*size;p+=(Math.ceil(Math.abs(dark*20-tot*10)/tot)-1)*10;return p};
    let best=0,bp=Infinity;for(let m=0;m<8;m++){mask(m);fmt(m);const p=pen();if(p<bp){bp=p;best=m}mask(m)}
    mask(best);fmt(best);return{size,M,v};
  }
  function svg(text,opt){const q=make(text),qz=4,N=q.size+qz*2;let d="";
    for(let y=0;y<q.size;y++)for(let x=0;x<q.size;x++)if(q.M[y][x])d+=`M${x+qz},${y+qz}h1v1h-1z`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${N} ${N}" shape-rendering="crispEdges" role="img" aria-label="${(opt&&opt.label)||"QR Code"}"><rect width="${N}" height="${N}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`}
  return{make,svg};
})();
