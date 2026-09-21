import {evaluate, validateCollection} from '../lib/domain.mjs';
const $ = (id) => document.getElementById(id);
const query = `*[_type == "exhibit" && reviewStatus == "verified"] | order(order asc, _id asc) {
  _id,_type,_rev,_updatedAt,title,slug,category,claim,order,reviewStatus,takeaway,sources,evidence->,
  "interpretations":interpretations[]->{...,evidence->}
}`;
let collection = [], selected = 0, interpretationIndex = 0;
let choices = new Map();
const verdicts = {supported:'The claim holds under this interpretation.',unsupported:'The claim does not hold under this interpretation.',conditional:'The claim needs this condition to hold.'};
function setText(id,value) {$(id).textContent=value;}
function element(tag,text,className) {const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;}
function drawTable(evidence) {
  const table=element('table');table.append(element('caption',evidence.title,'sr-only'));
  const head=element('thead'),heading=element('tr');
  ['Record',...evidence.columns].forEach(label=>{const th=element('th',label);th.scope='col';heading.append(th);});head.append(heading);table.append(head);
  const body=element('tbody');evidence.rows.forEach(row=>{const tr=element('tr'),label=element('th',row.label);label.scope='row';tr.append(label);row.cells.forEach(cell=>{const td=element('td',cell.trim()===''?'(missing)':cell);if(cell.trim()==='')td.className='missing';tr.append(td);});body.append(tr);});table.append(body);$('table-region').replaceChildren(table);
}
function drawNavigation() {
  const fragment=document.createDocumentFragment();collection.forEach((exhibit,index)=>{const button=element('button');button.type='button';button.append(element('span',String(index+1).padStart(2,'0'),'nav-number'),element('span',exhibit.title));if(index===selected)button.setAttribute('aria-current','true');button.addEventListener('click',()=>selectExhibit(index,true));fragment.append(button);});$('exhibit-nav').replaceChildren(fragment);
}
function updateChoice() {
  const choice=choices.get(collection[selected]._id);document.querySelectorAll('[data-choice]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.choice===choice)));setText('choice-feedback',choice?'Your position is noted. Compare both interpretations below.':'There is no score. Look for the condition that matters.');
}
function renderInterpretation() {
  const exhibit=collection[selected],interpretation=exhibit.interpretations[interpretationIndex],computed=evaluate(exhibit.evidence,interpretation);
  setText('assumption',interpretation.assumption);setText('result',computed.display);$('steps').replaceChildren(...computed.steps.map(step=>element('li',step)));setText('verdict',verdicts[interpretation.verdict]);setText('explanation',interpretation.explanation);Array.from($('interpretations').children).forEach((button,index)=>button.setAttribute('aria-pressed',String(index===interpretationIndex)));
}
function openNotes(moveFocus=false) {$('notes').hidden=false;$('reveal').hidden=true;renderInterpretation();if(moveFocus)$('notes-title').focus();}
function selectExhibit(index,focus=false) {
  selected=index;interpretationIndex=0;const exhibit=collection[selected];setText('exhibit-title',exhibit.title);setText('category',exhibit.category);setText('position',`${String(index+1).padStart(2,'0')} / ${String(collection.length).padStart(2,'0')}`);setText('claim',exhibit.claim);setText('evidence-title',exhibit.evidence.title);setText('origin',exhibit.evidence.originNote);setText('takeaway',exhibit.takeaway);drawTable(exhibit.evidence);drawNavigation();updateChoice();$('notes').hidden=true;$('reveal').hidden=false;
  $('interpretations').replaceChildren(...exhibit.interpretations.map((interpretation,i)=>{const button=element('button',interpretation.label);button.type='button';button.setAttribute('aria-pressed',String(i===0));button.addEventListener('click',()=>{interpretationIndex=i;renderInterpretation();});return button;}));
  $('sources').replaceChildren(...exhibit.sources.map(source=>{const li=element('li'),a=element('a',source.title);a.href=source.url;a.rel='noopener noreferrer';li.append(a);return li;}));setText('next',index===collection.length-1?'Back to first exhibit ↺':'Next exhibit →');if(focus)$('exhibit-title').focus();
}
async function load() {
  $('reload').disabled=true;$('reload').setAttribute('aria-busy','true');$('load-error').hidden=true;setText('collection-status','Reading the published collection…');const previousId=collection[selected]?._id;
  try {const url=new URL('https://e1rm1vsv.api.sanity.io/v2026-03-01/data/query/production');url.search=new URLSearchParams({query,perspective:'published',returnQuery:'false'}).toString();const response=await fetch(url,{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(15000)});if(!response.ok)throw new Error(`HTTP ${response.status}`);const body=await response.json(),incoming=validateCollection(body.result);collection=incoming;choices=new Map();$('exhibition').hidden=!collection.length;$('empty').hidden=!!collection.length;if(collection.length)selectExhibit(Math.max(0,collection.findIndex(e=>e._id===previousId)));const now=new Intl.DateTimeFormat(undefined,{hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date());setText('collection-status',`${collection.length} published exhibits · refreshed ${now}`);
  } catch { $('load-error').hidden=false;setText('load-error',collection.length?'The collection could not be refreshed. You are viewing the previous successful load. Try Reload exhibits.':'The collection could not be loaded or its consistency checks failed. Try Reload exhibits.');setText('collection-status',collection.length?'Previous collection retained — refresh failed.':'Collection unavailable.');
  } finally {$('reload').disabled=false;$('reload').removeAttribute('aria-busy');}
}
$('reload').addEventListener('click',load);$('reveal').addEventListener('click',()=>openNotes(true));document.querySelectorAll('[data-choice]').forEach(button=>button.addEventListener('click',()=>{if(!collection.length)return;choices.set(collection[selected]._id,button.dataset.choice);updateChoice();openNotes();}));$('reset').addEventListener('click',()=>{if(!collection.length)return;choices.delete(collection[selected]._id);selectExhibit(selected,true);});$('next').addEventListener('click',()=>{if(collection.length)selectExhibit((selected+1)%collection.length,true);});load();
