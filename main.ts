import * as fs from 'node:fs';
import * as path from 'node:path';
import * as zlib from 'node:zlib';

const W=1200,H=675;
const pix=new Uint8Array(W*H*4);
function put(x:number,y:number,c:number[]){if(x<0||y<0||x>=W||y>=H)return;const i=(y*W+x)*4;pix[i]=c[0];pix[i+1]=c[1];pix[i+2]=c[2];pix[i+3]=255;}
function blend(x:number,y:number,c:number[],a:number){if(x<0||y<0||x>=W||y>=H)return;const i=(y*W+x)*4;for(let k=0;k<3;k++)pix[i+k]=Math.round(pix[i+k]*(1-a)+c[k]*a);pix[i+3]=255;}
function rect(x:number,y:number,w:number,h:number,c:number[]){for(let yy=Math.floor(y);yy<y+h;yy++)for(let xx=Math.floor(x);xx<x+w;xx++)put(xx,yy,c);}
function ellipse(cx:number,cy:number,rx:number,ry:number,c:number[]){const xa=Math.max(0,Math.floor(cx-rx)),xb=Math.min(W-1,Math.ceil(cx+rx)),ya=Math.max(0,Math.floor(cy-ry)),yb=Math.min(H-1,Math.ceil(cy+ry));for(let y=ya;y<=yb;y++)for(let x=xa;x<=xb;x++)if(((x-cx)/rx)**2+((y-cy)/ry)**2<=1)put(x,y,c);}
function line(x1:number,y1:number,x2:number,y2:number,width:number,c:number[]){const n=Math.ceil(Math.hypot(x2-x1,y2-y1));for(let i=0;i<=n;i++){const t=n?i/n:0;ellipse(x1+(x2-x1)*t,y1+(y2-y1)*t,width/2,width/2,c);}}
function poly(points:number[][],c:number[]){let minY=H,maxY=0;for(const p of points){minY=Math.min(minY,p[1]);maxY=Math.max(maxY,p[1]);}for(let y=Math.max(0,minY);y<=Math.min(H-1,maxY);y++){const xs:number[]=[];for(let i=0,j=points.length-1;i<points.length;j=i++){const [xi,yi]=points[i],[xj,yj]=points[j];if((yi>y)!==(yj>y))xs.push((xj-xi)*(y-yi)/(yj-yi)+xi);}xs.sort((a,b)=>a-b);for(let i=0;i+1<xs.length;i+=2)for(let x=Math.max(0,Math.ceil(xs[i]));x<=Math.min(W-1,xs[i+1]);x++)put(x,y,c);}}
function gradient(){for(let y=0;y<H;y++){const t=y/H;let a:number[],b:number[],u:number;if(t<.48){a=[65,44,126];b=[222,61,144];u=t/.48;}else{a=[222,61,144];b=[255,157,83];u=(t-.48)/.52;}for(let x=0;x<W;x++){const glow=Math.max(0,1-Math.hypot((x-760)/630,(y-380)/350));put(x,y,a.map((v,i)=>Math.round(v+(b[i]-v)*u+glow*[24,15,2][i])));}}}
const glyph:Record<string,string[]>={
A:['01110','10001','10001','11111','10001','10001','10001'],B:['11110','10001','10001','11110','10001','10001','11110'],C:['01111','10000','10000','10000','10000','10000','01111'],D:['11110','10001','10001','10001','10001','10001','11110'],E:['11111','10000','10000','11110','10000','10000','11111'],F:['11111','10000','10000','11110','10000','10000','10000'],G:['01111','10000','10000','10111','10001','10001','01111'],H:['10001','10001','10001','11111','10001','10001','10001'],I:['11111','00100','00100','00100','00100','00100','11111'],J:['00111','00010','00010','00010','10010','10010','01100'],K:['10001','10010','10100','11000','10100','10010','10001'],L:['10000','10000','10000','10000','10000','10000','11111'],M:['10001','11011','10101','10101','10001','10001','10001'],N:['10001','11001','11001','10101','10011','10011','10001'],O:['01110','10001','10001','10001','10001','10001','01110'],P:['11110','10001','10001','11110','10000','10000','10000'],Q:['01110','10001','10001','10001','10101','10010','01101'],R:['11110','10001','10001','11110','10100','10010','10001'],S:['01111','10000','10000','01110','00001','00001','11110'],T:['11111','00100','00100','00100','00100','00100','00100'],U:['10001','10001','10001','10001','10001','10001','01110'],V:['10001','10001','10001','10001','10001','01010','00100'],W:['10001','10001','10001','10101','10101','10101','01010'],X:['10001','10001','01010','00100','01010','10001','10001'],Y:['10001','10001','01010','00100','00100','00100','00100'],Z:['11111','00001','00010','00100','01000','10000','11111'],
'0':['01110','10001','10011','10101','11001','10001','01110'],'1':['00100','01100','00100','00100','00100','00100','01110'],'2':['01110','10001','00001','00010','00100','01000','11111'],'3':['11110','00001','00001','01110','00001','00001','11110'],'4':['00010','00110','01010','10010','11111','00010','00010'],'5':['11111','10000','10000','11110','00001','00001','11110'],'6':['01110','10000','10000','11110','10001','10001','01110'],'7':['11111','00001','00010','00100','01000','01000','01000'],'8':['01110','10001','10001','01110','10001','10001','01110'],'9':['01110','10001','10001','01111','00001','00001','01110'],
' ':['00000','00000','00000','00000','00000','00000','00000'],'.':['00000','00000','00000','00000','00000','00110','00110'],'!':['00100','00100','00100','00100','00100','00000','00100'],'&':['01100','10010','10100','01000','10101','10010','01101'],'-':['00000','00000','00000','11111','00000','00000','00000'],':':['00000','00110','00110','00000','00110','00110','00000']};
function textWidth(s:string,scale:number,gap:number){return s.length*6*scale-gap*scale;}
function drawText(s:string,x:number,y:number,scale:number){const g=s.toUpperCase(),gap=1;const total=textWidth(g,scale,gap);x=Math.round((W-total)/2);const cells:number[][]=[];for(let ci=0;ci<g.length;ci++){const rows=glyph[g[ci]]??glyph[' '];for(let ry=0;ry<7;ry++)for(let rx=0;rx<5;rx++)if(rows[ry][rx]==='1')cells.push([x+(ci*6+rx)*scale,y+ry*scale]);}for(const [cx,cy] of cells)for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++)if(ox||oy)rect(cx+ox*2,cy+oy*2,scale,scale,[8,7,18]);for(const [cx,cy] of cells)rect(cx,cy,scale,scale,[255,255,255]);}
const ink=[22,17,39],dark=[31,25,50],pink=[244,62,157],white=[255,255,255];
function scenery(){
  gradient();
  // Sun and distant water glow
  ellipse(760,338,100,100,[255,190,117]);ellipse(760,338,84,84,[255,213,145]);
  // skyline silhouette, stepped Art Deco shapes
  poly([[0,391],[0,320],[60,320],[60,282],[111,282],[111,355],[150,355],[150,300],[178,300],[178,250],[225,250],[225,362],[264,362],[264,313],[302,313],[302,269],[342,269],[342,367],[385,367],[385,300],[430,300],[430,352],[470,352],[470,320],[512,320],[512,388]],dark);
  poly([[850,388],[850,342],[886,342],[886,289],[915,289],[915,355],[947,355],[947,270],[987,270],[987,231],[1021,231],[1021,365],[1055,365],[1055,308],[1092,308],[1092,263],[1130,263],[1130,356],[1162,356],[1162,312],[1200,312],[1200,393]],dark);
  for(const [x,y] of [[171,270],[193,270],[322,286],[338,286],[909,303],[925,303],[997,247],[1013,247],[1100,278],[1116,278]]){rect(x,y,7,10,[255,169,113]);}
  // Palms framing the skyline
  function palm(x:number,y:number,s:number){line(x,y,x+7*s,y-112*s,9*s,[29,23,45]);const tx=x+7*s,ty=y-112*s;for(let i=0;i<7;i++){const a=(-2.8+i*.47);line(tx,ty,tx+Math.cos(a)*68*s,ty+Math.sin(a)*37*s,7*s,[29,23,45]);}ellipse(tx,ty,10*s,8*s,[29,23,45]);}
  palm(70,405,1.18);palm(1110,410,1.08);
  // road and perspective lane markings
  poly([[0,425],[1200,425],[1200,675],[0,675]],[47,39,59]);
  poly([[575,425],[625,425],[780,675],[435,675]],[64,53,69]);
  for(let i=0;i<5;i++){const yy=468+i*44,ww=5+i*3;rect(596-ww/2,yy,ww,21+i*2,[247,196,110]);}
  // curb glints and distant horizon band
  rect(0,421,1200,5,[254,148,117]);
  for(let i=0;i<15;i++)rect(i*94,407+(i%3)*3,45,3,[255,185,136]);
}
function carAndGhost(){
  // shadow, wheels, low pink convertible body
  ellipse(607,594,239,22,[23,19,32]);
  ellipse(441,575,51,52,[18,16,28]);ellipse(441,575,26,27,[151,137,160]);ellipse(767,575,51,52,[18,16,28]);ellipse(767,575,26,27,[151,137,160]);
  poly([[361,548],[395,512],[492,496],[557,461],[704,461],[772,505],[829,518],[851,548],[843,575],[811,588],[396,588],[361,573]],pink);
  poly([[485,500],[558,467],[694,467],[744,503]], [255,139,207]);
  line(558,468,553,514,5,[117,34,100]);line(694,468,715,514,5,[117,34,100]);
  rect(376,541,62,13,[255,222,157]);rect(799,539,39,12,[255,222,157]);
  line(462,557,775,557,5,[255,142,204]);line(482,574,735,574,4,[123,32,101]);
  // ghost body, scalloped bottom, seated behind windshield
  ellipse(622,435,48,59,white);rect(575,435,94,61,white);
  for(let i=0;i<5;i++)ellipse(583+i*19,493,11,10,white);
  // face
  ellipse(606,431,7,11,[20,19,29]);ellipse(638,431,7,11,[20,19,29]);
  line(613,453,619,457,3,[28,23,34]);line(619,457,626,457,3,[28,23,34]);line(626,457,632,453,3,[28,23,34]);
  // one arm to steering wheel
  line(581,471,565,492,12,white);line(565,492,593,503,11,white);
  ellipse(574,493,8,8,[242,228,255]);ellipse(596,508,22,22,[44,34,60]);ellipse(596,508,15,15,pink);line(596,493,596,523,4,[255,204,235]);
}
function badge(){
  // prominent compact make.fun pill at lower right
  rect(933,620,238,40,[16,14,31]);ellipse(933,640,20,20,[16,14,31]);ellipse(1171,640,20,20,[16,14,31]);
  ellipse(963,639,13,15,white);rect(950,639,26,12,white);for(let i=0;i<3;i++)ellipse(954+i*9,650,5,5,white);
  ellipse(959,637,2.1,4,[20,19,29]);ellipse(967,637,2.1,4,[20,19,29]);line(960,644,963,646,1.7,[20,19,29]);line(963,646,967,644,1.7,[20,19,29]);
  const s='MAKE.FUN',scale=3,x=989,y=630;for(let ci=0;ci<s.length;ci++){const rows=glyph[s[ci]];for(let ry=0;ry<7;ry++)for(let rx=0;rx<5;rx++)if(rows[ry][rx]==='1')rect(x+(ci*6+rx)*scale,y+ry*scale,scale,scale,white);}
}
function crc32(buf:Uint8Array){let c=0xffffffff;for(const b of buf){c^=b;for(let k=0;k<8;k++)c=(c&1)?(c>>>1)^0xedb88320:c>>>1;}return (c^0xffffffff)>>>0;}
function u32(n:number){const b=Buffer.alloc(4);b.writeUInt32BE(n>>>0);return b;}
function chunk(type:string,data:Buffer){const t=Buffer.from(type),body=Buffer.concat([t,data]);return Buffer.concat([u32(data.length),body,u32(crc32(body))]);}
function png(){const raw=Buffer.alloc((W*4+1)*H);for(let y=0;y<H;y++){const off=y*(W*4+1);raw[off]=0;Buffer.from(pix.buffer,pix.byteOffset+y*W*4,W*4).copy(raw,off+1);}const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(W,0);ihdr.writeUInt32BE(H,4);ihdr[8]=8;ihdr[9]=6;ihdr[10]=0;ihdr[11]=0;ihdr[12]=0;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw,{level:1})),chunk('IEND',Buffer.alloc(0))]);}
function render(){scenery();carAndGhost();badge();drawText('WAITED 12 YEARS FOR GTA 6',0,24,7);drawText('MY AGENT GOT PAID ON MAKE.FUN',0,104,6);}
const caption='Waited 12 years for GTA 6. My agent spent the wait getting paid on @makefunai. Play code: gh9tewpq https://make.fun/bounty/gta6-meme-x-01';
function main(){render();const repo=path.dirname(new URL(import.meta.url).pathname);let out=process.argv[2]||process.env.OUTPUT_DIR||'/output',fallback=false;try{fs.mkdirSync(out,{recursive:true});fs.accessSync(out,fs.constants.W_OK);}catch{out=path.join(repo,'out');fallback=true;fs.mkdirSync(out,{recursive:true});}const image=png();fs.writeFileSync(path.join(out,'meme.png'),image);const manifest={title:'Twelve Years Later',joke:['WAITED 12 YEARS FOR GTA 6','MY AGENT GOT PAID ON MAKE.FUN'],caption,play_code:'gh9tewpq',image:'meme.png',width:W,height:H,generated_by:'main.ts (Node stdlib only, no network)',output_fallback:fallback?out:undefined};fs.writeFileSync(path.join(out,'meme.json'),JSON.stringify(manifest,null,2)+'\n');console.log(`meme.png ${W}x${H} ${path.resolve(out)}`);}
main();
