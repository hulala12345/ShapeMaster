const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const toolbar = document.querySelector('.toolbar');
const propertiesPanel = document.getElementById('properties');
const stylePanel = document.getElementById('style-controls');
const layerList = document.getElementById('layers');

let shapes = [];
let selectedShapes = [];
let currentTool = 'select';
let drawing = false;
let startX = 0;
let startY = 0;
let tempShape = null;
let patternCanvas = document.createElement('canvas');
let patterns = {};

function createPatterns() {
    patternCanvas.width = 10;
    patternCanvas.height = 10;
    let pctx = patternCanvas.getContext('2d');
    pctx.fillStyle = '#fff';
    pctx.fillRect(0,0,10,10);
    pctx.strokeStyle = '#000';
    pctx.beginPath();
    pctx.moveTo(0,0);pctx.lineTo(10,10);
    pctx.moveTo(10,0);pctx.lineTo(0,10);
    pctx.stroke();
    patterns['cross'] = ctx.createPattern(patternCanvas,'repeat');

    pctx.clearRect(0,0,10,10);
    pctx.fillStyle = '#fff';
    pctx.fillRect(0,0,10,10);
    pctx.fillStyle = '#000';
    pctx.fillRect(0,0,5,5);
    pctx.fillRect(5,5,5,5);
    patterns['checker'] = ctx.createPattern(patternCanvas,'repeat');
}

createPatterns();

function drawShapes() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    shapes.forEach((shape) => {
        ctx.save();
        ctx.fillStyle = shape.fill;
        if (shape.gradient) {
            ctx.fillStyle = shape.gradient;
        }
        if (shape.pattern && patterns[shape.pattern]) {
            ctx.fillStyle = patterns[shape.pattern];
        }
        ctx.beginPath();
        switch(shape.type) {
            case 'rectangle':
                ctx.rect(shape.x, shape.y, shape.w, shape.h);
                break;
            case 'circle':
                ctx.arc(shape.x, shape.y, shape.r, 0, Math.PI * 2);
                break;
            case 'triangle':
                ctx.moveTo(shape.x, shape.y);
                ctx.lineTo(shape.x + shape.w, shape.y);
                ctx.lineTo(shape.x + shape.w/2, shape.y - shape.h);
                ctx.closePath();
                break;
            case 'polygon':
                const angleStep = (Math.PI*2)/shape.sides;
                ctx.moveTo(shape.x + shape.r, shape.y);
                for(let i=1;i<shape.sides;i++){
                    ctx.lineTo(shape.x + shape.r*Math.cos(angleStep*i), shape.y + shape.r*Math.sin(angleStep*i));
                }
                ctx.closePath();
                break;
        }
        ctx.fill();
        ctx.restore();
    });
}

function updateLayerList() {
    layerList.innerHTML = '';
    shapes.forEach((shape, index) => {
        const li = document.createElement('li');
        li.textContent = `${shape.type} ${index}`;
        li.dataset.index = index;
        if (selectedShapes.includes(shape)) {
            li.classList.add('active');
        }
        layerList.appendChild(li);
    });
}

function setTool(tool) {
    currentTool = tool;
}

toolbar.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
        setTool(e.target.dataset.tool);
    }
});

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
    drawing = true;
    if (currentTool !== 'select') {
        tempShape = {type: currentTool, x: startX, y: startY, w:0, h:0, r:0, sides:5, fill:'#ff0000', gradient:null, pattern:null};
    }
});

canvas.addEventListener('mousemove', (e) => {
    if(!drawing) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (currentTool !== 'select' && tempShape) {
        tempShape.w = x - startX;
        tempShape.h = y - startY;
        tempShape.r = Math.hypot(tempShape.w, tempShape.h);
        drawShapes();
        drawTempShape();
    }
});

canvas.addEventListener('mouseup', () => {
    drawing = false;
    if (tempShape) {
        shapes.push(tempShape);
        tempShape = null;
        drawShapes();
        updateLayerList();
    }
});

function drawTempShape(){
    if(!tempShape) return;
    ctx.save();
    ctx.strokeStyle = 'blue';
    ctx.setLineDash([5,5]);
    ctx.beginPath();
    switch(tempShape.type){
        case 'rectangle':
            ctx.rect(tempShape.x, tempShape.y, tempShape.w, tempShape.h);
            break;
        case 'circle':
            ctx.arc(tempShape.x, tempShape.y, tempShape.r, 0, Math.PI*2);
            break;
        case 'triangle':
            ctx.moveTo(tempShape.x, tempShape.y);
            ctx.lineTo(tempShape.x + tempShape.w, tempShape.y);
            ctx.lineTo(tempShape.x + tempShape.w/2, tempShape.y - tempShape.h);
            ctx.closePath();
            break;
        case 'polygon':
            const angleStep = (Math.PI*2)/tempShape.sides;
            ctx.moveTo(tempShape.x + tempShape.r, tempShape.y);
            for(let i=1;i<tempShape.sides;i++){
                ctx.lineTo(tempShape.x + tempShape.r*Math.cos(angleStep*i), tempShape.y + tempShape.r*Math.sin(angleStep*i));
            }
            ctx.closePath();
            break;
    }
    ctx.stroke();
    ctx.restore();
}

layerList.addEventListener('click', (e) => {
    if(e.target.tagName==='LI'){
        const index = Number(e.target.dataset.index);
        const shape = shapes[index];
        if(e.shiftKey){
            if(selectedShapes.includes(shape)){
                selectedShapes = selectedShapes.filter(s=>s!==shape);
            }else{
                selectedShapes.push(shape);
            }
        }else{
            selectedShapes = [shape];
        }
        updatePropertiesPanel();
        updateLayerList();
    }
});

function updatePropertiesPanel(){
    propertiesPanel.innerHTML = '';
    if(selectedShapes.length===0)return;
    const shape = selectedShapes[0];
    addNumberInput('x', shape.x, v=>{shape.x = v; drawShapes();});
    addNumberInput('y', shape.y, v=>{shape.y = v; drawShapes();});
    if(shape.type==='rectangle' || shape.type==='triangle'){
        addNumberInput('width', shape.w, v=>{shape.w=v; drawShapes();});
        addNumberInput('height', shape.h, v=>{shape.h=v; drawShapes();});
    }
    if(shape.type==='circle' || shape.type==='polygon'){
        addNumberInput('radius', shape.r, v=>{shape.r=v; drawShapes();});
    }
    if(shape.type==='polygon'){
        addNumberInput('sides', shape.sides, v=>{shape.sides=v; drawShapes();});
    }
}

function addNumberInput(name, value, onChange){
    const label = document.createElement('label');
    label.textContent = name;
    const input = document.createElement('input');
    input.type='number';
    input.value=value;
    input.addEventListener('input', ()=>{onChange(Number(input.value));});
    label.appendChild(input);
    propertiesPanel.appendChild(label);
}

function updateStylePanel(){
    stylePanel.innerHTML = '';
    if(selectedShapes.length===0)return;
    const shape = selectedShapes[0];
    addColorInput('fill', shape.fill, v=>{shape.fill=v; shape.gradient=null; shape.pattern=null; drawShapes();});
    addColorInput('gradient start', '#ff0000', start=>{
        addColorInput('gradient end', '#0000ff', end=>{
            const grad = ctx.createLinearGradient(shape.x, shape.y, shape.x+shape.w, shape.y+shape.h);
            grad.addColorStop(0,start);
            grad.addColorStop(1,end);
            shape.gradient=grad; shape.pattern=null; drawShapes();
        });
    });
    const select = document.createElement('select');
    const optNone = document.createElement('option'); optNone.value=''; optNone.textContent='None';
    const optCross = document.createElement('option'); optCross.value='cross'; optCross.textContent='Cross';
    const optChecker = document.createElement('option'); optChecker.value='checker'; optChecker.textContent='Checker';
    select.appendChild(optNone); select.appendChild(optCross); select.appendChild(optChecker);
    select.addEventListener('change', ()=>{shape.pattern=select.value||null; shape.gradient=null; drawShapes();});
    stylePanel.appendChild(select);
}

function addColorInput(name, value, onChange){
    const label = document.createElement('label');
    label.textContent = name;
    const input = document.createElement('input');
    input.type='color';
    input.value=value;
    input.addEventListener('input', ()=>{onChange(input.value);});
    label.appendChild(input);
    stylePanel.appendChild(label);
}

function bringToFront(){
    selectedShapes.forEach(shape=>{
        shapes = shapes.filter(s=>s!==shape);
        shapes.push(shape);
    });
    updateLayerList();
    drawShapes();
}

function sendToBack(){
    selectedShapes.forEach(shape=>{
        shapes = shapes.filter(s=>s!==shape);
        shapes.unshift(shape);
    });
    updateLayerList();
    drawShapes();
}

function align(direction){
    if(selectedShapes.length<2)return;
    const values = selectedShapes.map(s=>({left:s.x, right:s.x+s.w, top:s.y-s.h, bottom:s.y}));
    switch(direction){
        case 'left':
            const minLeft = Math.min(...values.map(v=>v.left));
            selectedShapes.forEach(s=>{s.x = minLeft;});
            break;
        case 'right':
            const maxRight = Math.max(...values.map(v=>v.right));
            selectedShapes.forEach(s=>{s.x = maxRight - s.w;});
            break;
        case 'top':
            const minTop = Math.min(...values.map(v=>v.top));
            selectedShapes.forEach(s=>{s.y = minTop + s.h;});
            break;
        case 'bottom':
            const maxBottom = Math.max(...values.map(v=>v.bottom));
            selectedShapes.forEach(s=>{s.y = maxBottom;});
            break;
        case 'center':
            const avgX = values.reduce((a,v)=>a+v.left+v.right,0)/(2*values.length);
            selectedShapes.forEach(s=>{s.x = avgX - s.w/2;});
            break;
    }
    drawShapes();
    updatePropertiesPanel();
}

// update UI when selection changes
function refreshUI(){
    updatePropertiesPanel();
    updateStylePanel();
    updateLayerList();
}

refreshUI();
