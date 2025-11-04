// Get the container element's dimensions
const container = document.getElementById('container');
const width = container.offsetWidth;
const height = container.offsetHeight;

// Create a Konva Stage
const stage = new Konva.Stage({
  container: 'container',   // id of container <div>
  width: width,
  height: height,
});

// Create a Layer
let layer = new Konva.Layer();

// Add the layer to the stage
stage.add(layer);

// Function to add a transformer to a shape
function addTransformer(shape) {
    const tr = new Konva.Transformer({
        nodes: [shape],
        keepRatio: true,
        boundBoxFunc: (oldBox, newBox) => {
            // limit resize
            if (newBox.width < 5 || newBox.height < 5) {
                return oldBox;
            }
            return newBox;
        },
    });

    if (shape.getClassName() === 'Image') {
        tr.boundBoxFunc((oldBox, newBox) => {
            if (newBox.width < 10 || newBox.height < 10) {
                return oldBox;
            }
            return newBox;
        });
        shape.on('transform', () => {
            const node = shape;
            const crop = node.crop();
            const newCrop = {
                x: crop.x / node.scaleX(),
                y: crop.y / node.scaleY(),
                width: node.width(),
                height: node.height()
            };
            node.crop(newCrop);
            node.scaleX(1);
            node.scaleY(1);
        });
    }
    layer.add(tr);
    layer.draw();

    shape.on('click tap', (e) => {
        // if shift key is pressed, add/remove shape from selection
        const metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
        const isSelected = tr.nodes().indexOf(shape) >= 0;

        if (!metaPressed && !isSelected) {
            // if no key pressed and the node is not selected
            // select just one
            tr.nodes([shape]);
        } else if (metaPressed && isSelected) {
            // if we select node that is already selected, remove it from selection
            const nodes = tr.nodes().slice(); // use slice to have new copy of array
            // remove node from array
            nodes.splice(nodes.indexOf(shape), 1);
            tr.nodes(nodes);
        } else if (metaPressed && !isSelected) {
            // add the node into selection
            const nodes = tr.nodes().concat([shape]);
            tr.nodes(nodes);
        }
        updatePropertiesPanel(tr.nodes().length === 1 ? shape : null);
        updateArrangePanel(tr.nodes().length === 1 ? shape : null);
        layer.draw();
    });
}

const propertiesPanel = document.getElementById('properties-panel');

function updatePropertiesPanel(node) {
    propertiesPanel.innerHTML = ''; // Clear the panel

    if (!node) {
        propertiesPanel.innerHTML = '<p>Select an object to see its properties.</p>';
        return;
    }

    const type = node.getClassName();
    let controls = `<h4>${type} Properties</h4>`;

    // Generic properties
    controls += `
        <label>X Position</label>
        <input type="number" id="x-pos" value="${node.x()}">
        <label>Y Position</label>
        <input type="number" id="y-pos" value="${node.y()}">
        <label>Width</label>
        <input type="number" id="width" value="${node.width()}">
        <label>Height</label>
        <input type="number" id="height" value="${node.height()}">
        <label>Rotation</label>
        <input type="number" id="rotation" value="${node.rotation()}">
    `;

    propertiesPanel.innerHTML = controls;

    // Event listeners for generic properties
    document.getElementById('x-pos').addEventListener('change', (e) => node.x(parseFloat(e.target.value)));
    document.getElementById('y-pos').addEventListener('change', (e) => node.y(parseFloat(e.target.value)));
    document.getElementById('width').addEventListener('change', (e) => node.width(parseFloat(e.target.value)));
    document.getElementById('height').addEventListener('change', (e) => node.height(parseFloat(e.target.value)));
    document.getElementById('rotation').addEventListener('change', (e) => node.rotation(parseFloat(e.target.value)));

    // Re-draw layer after property change
    propertiesPanel.querySelectorAll('input, select').forEach(input => {
        input.addEventListener('change', () => layer.draw());
    });

    if (type === 'Text') {
        let textControls = `
            <hr>
            <label>Font Size</label>
            <input type="number" id="font-size" value="${node.fontSize()}">
            <label>Font Family</label>
            <select id="font-family">
                <option value="Arial" ${node.fontFamily() === 'Arial' ? 'selected' : ''}>Arial</option>
                <option value="Times New Roman" ${node.fontFamily() === 'Times New Roman' ? 'selected' : ''}>Times New Roman</option>
                <option value="Verdana" ${node.fontFamily() === 'Verdana' ? 'selected' : ''}>Verdana</option>
            </select>
            <label>Fill Color</label>
            <input type="color" id="fill-color" value="${node.fill()}">
            <div>
                <button id="font-style-bold">Bold</button>
                <button id="font-style-italic">Italic</button>
            </div>
            <div>
                <button id="align-left">Left</button>
                <button id="align-center">Center</button>
                <button id="align-right">Right</button>
            </div>
        `;
        propertiesPanel.innerHTML += textControls;

        // Event listeners for text properties
        document.getElementById('font-size').addEventListener('change', (e) => node.fontSize(parseFloat(e.target.value)));
        document.getElementById('font-family').addEventListener('change', (e) => node.fontFamily(e.target.value));
        document.getElementById('fill-color').addEventListener('change', (e) => node.fill(e.target.value));
        document.getElementById('font-style-bold').addEventListener('click', () => {
            const currentStyle = node.fontStyle();
            if (currentStyle.includes('bold')) {
                node.fontStyle(currentStyle.replace('bold', '').trim());
            } else {
                node.fontStyle((currentStyle + ' bold').trim());
            }
            layer.draw();
        });
        document.getElementById('font-style-italic').addEventListener('click', () => {
            const currentStyle = node.fontStyle();
            if (currentStyle.includes('italic')) {
                node.fontStyle(currentStyle.replace('italic', '').trim());
            } else {
                node.fontStyle((currentStyle + ' italic').trim());
            }
            layer.draw();
        });
        document.getElementById('align-left').addEventListener('click', () => node.align('left'));
        document.getElementById('align-center').addEventListener('click', () => node.align('center'));
        document.getElementById('align-right').addEventListener('click', () => node.align('right'));

        propertiesPanel.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', () => layer.draw());
        });
    }

    if (type === 'Rect' || type === 'Circle') {
        let shapeControls = `
            <hr>
            <label>Fill Color</label>
            <input type="color" id="fill-color" value="${node.fill()}">
            <label>Stroke Color</label>
            <input type="color" id="stroke-color" value="${node.stroke()}">
            <label>Stroke Width</label>
            <input type="number" id="stroke-width" value="${node.strokeWidth()}">
            <label>Opacity</label>
            <input type="range" id="opacity" min="0" max="1" step="0.1" value="${node.opacity()}">
        `;
        propertiesPanel.innerHTML += shapeControls;

        // Event listeners for shape properties
        document.getElementById('fill-color').addEventListener('change', (e) => node.fill(e.target.value));
        document.getElementById('stroke-color').addEventListener('change', (e) => node.stroke(e.target.value));
        document.getElementById('stroke-width').addEventListener('change', (e) => node.strokeWidth(parseFloat(e.target.value)));
        document.getElementById('opacity').addEventListener('input', (e) => node.opacity(parseFloat(e.target.value)));

        propertiesPanel.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', () => layer.draw());
            input.addEventListener('input', () => layer.draw());
        });
    }

    if (type === 'Image') {
        let imageFiltersControls = `
            <hr>
            <h4>Image Filters</h4>
            <button id="filter-grayscale">Grayscale</button>
            <button id="filter-sepia">Sepia</button>
            <button id="filter-blur">Blur</button>
            <button id="filter-reset">Reset</button>
        `;
        propertiesPanel.innerHTML += imageFiltersControls;

        // Event listeners for image filters
        document.getElementById('filter-grayscale').addEventListener('click', () => {
            node.cache();
            node.filters([Konva.Filters.Grayscale]);
            layer.batchDraw();
        });
        document.getElementById('filter-sepia').addEventListener('click', () => {
            node.cache();
            node.filters([Konva.Filters.Sepia]);
            layer.batchDraw();
        });
        document.getElementById('filter-blur').addEventListener('click', () => {
            node.cache();
            node.filters([Konva.Filters.Blur]);
            node.blurRadius(10);
            layer.batchDraw();
        });
        document.getElementById('filter-reset').addEventListener('click', () => {
            node.cache();
            node.filters([]);
            layer.batchDraw();
        });
    }
}

const arrangePanel = document.getElementById('arrange-panel');

function updateArrangePanel(node) {
    arrangePanel.innerHTML = ''; // Clear the panel

    if (!node) {
        return;
    }

    let arrangeControls = `
        <h4>Arrange</h4>
        <button id="move-up">Bring Forward</button>
        <button id="move-down">Send Backward</button>
        <button id="move-to-top">Bring to Front</button>
        <button id="move-to-bottom">Send to Back</button>
    `;
    arrangePanel.innerHTML = arrangeControls;

    // Event listeners for arrange controls
    document.getElementById('move-up').addEventListener('click', () => {
        node.moveUp();
        layer.draw();
    });
    document.getElementById('move-down').addEventListener('click', () => {
        node.moveDown();
        layer.draw();
    });
    document.getElementById('move-to-top').addEventListener('click', () => {
        node.moveToTop();
        layer.draw();
    });
    document.getElementById('move-to-bottom').addEventListener('click', () => {
        node.moveToBottom();
        layer.draw();
    });
}


// Deselect shapes when clicking on the stage
stage.on('click tap', function (e) {
    // if click on empty area - remove all transformers
    if (e.target === stage) {
        layer.find('Transformer').forEach(tr => tr.nodes([]));
        updatePropertiesPanel(null); // Clear properties panel
        updateArrangePanel(null); // Clear arrange panel
        layer.draw();
        return;
    }
});

document.getElementById('group-btn').addEventListener('click', () => {
    const tr = layer.findOne('Transformer');
    const nodes = tr.nodes();
    if (nodes.length > 1) {
        const group = new Konva.Group({
            draggable: true,
        });
        nodes.forEach(node => {
            node.moveTo(group);
        });
        layer.add(group);
        tr.nodes([group]);
        addTransformer(group);
        layer.draw();
    }
});

document.getElementById('ungroup-btn').addEventListener('click', () => {
    const tr = layer.findOne('Transformer');
    const nodes = tr.nodes();
    if (nodes.length === 1 && nodes[0].getClassName() === 'Group') {
        const group = nodes[0];
        group.getChildren().forEach(node => {
            node.moveTo(layer);
        });
        group.destroy();
        tr.nodes([]);
        layer.draw();
    }
});

console.log('Konva stage initialized');

// Image uploading
const uploadImage = document.getElementById('upload-image');
uploadImage.addEventListener('change', function (e) {
    const URL = window.URL || window.webkitURL;
    const url = URL.createObjectURL(e.target.files[0]);
    const img = new Image();
    img.src = url;
    img.onload = function () {
        const konvaImage = new Konva.Image({
            image: img,
            x: 50,
            y: 50,
            width: 200,
            height: 200,
            draggable: true,
        });
        layer.add(konvaImage);
        addTransformer(konvaImage);
        layer.draw();
    };
});

// Text functionality
const addText = document.getElementById('add-text');
addText.addEventListener('click', function () {
    const textNode = new Konva.Text({
        text: 'Sample Text',
        x: 50,
        y: 80,
        fontSize: 30,
        draggable: true,
        width: 200,
    });

    layer.add(textNode);
    addTransformer(textNode);
    layer.draw();

    textNode.on('dblclick dbltap', () => {
        // hide text node and transformer:
        textNode.hide();
        layer.findOne('Transformer').hide();
        layer.draw();

        // create textarea over canvas, in position of text
        const textPosition = textNode.getAbsolutePosition();
        const stageBox = stage.container().getBoundingClientRect();

        const areaPosition = {
            x: stageBox.left + textPosition.x,
            y: stageBox.top + textPosition.y,
        };

        const textarea = document.createElement('textarea');
        document.body.appendChild(textarea);

        // apply many styles to match text on canvas as close as possible
        textarea.value = textNode.text();
        textarea.style.position = 'absolute';
        textarea.style.top = areaPosition.y + 'px';
        textarea.style.left = areaPosition.x + 'px';
        textarea.style.width = textNode.width() * textNode.scaleX() + 'px';
        textarea.style.height = textNode.height() * textNode.scaleY() + 'px';
        textarea.style.fontSize = textNode.fontSize() * textNode.scaleY() + 'px';
        textarea.style.border = 'none';
        textarea.style.padding = '0px';
        textarea.style.margin = '0px';
        textarea.style.overflow = 'hidden';
        textarea.style.background = 'none';
        textarea.style.outline = 'none';
        textarea.style.resize = 'none';
        textarea.style.lineHeight = textNode.lineHeight();
        textarea.style.fontFamily = textNode.fontFamily();
        textarea.style.transformOrigin = 'left top';
        textarea.style.textAlign = textNode.align();
        textarea.style.color = textNode.fill();
        let rotation = textNode.rotation();
        let transform = '';
        if (rotation) {
            transform += 'rotateZ(' + rotation + 'deg)';
        }

        let px = 0;
        const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
        if (isFirefox) {
            px += 2 + Math.round(textNode.fontSize() / 20);
        }
        transform += `translateY(-${px}px)`;

        textarea.style.transform = transform;
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 3 + 'px';

        textarea.focus();

        function removeTextarea() {
            textarea.parentNode.removeChild(textarea);
            window.removeEventListener('click', handleOutsideClick);
            textNode.show();
            layer.findOne('Transformer').show();
            layer.draw();
        }

        function handleOutsideClick(e) {
            if (e.target !== textarea) {
                if (textarea.value === '') {
                    textNode.destroy();
                } else {
                    textNode.text(textarea.value);
                }
                removeTextarea();
            }
        }
        setTimeout(() => {
            window.addEventListener('click', handleOutsideClick);
        });

        textarea.addEventListener('keydown', function (e) {
            // hide on enter
            if (e.keyCode === 13 && !e.shiftKey) {
                if (textarea.value === '') {
                    textNode.destroy();
                } else {
                    textNode.text(textarea.value);
                }
                removeTextarea();
            }
            // on esc do not set value
            if (e.keyCode === 27) {
                removeTextarea();
            }
        });

        textarea.addEventListener('input', function () {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + textNode.fontSize() * 0.2 + 'px';
        });
    });
});

// Shape functionality
const addRect = document.getElementById('add-rect');
addRect.addEventListener('click', function () {
    const rect = new Konva.Rect({
        x: 20,
        y: 20,
        width: 100,
        height: 50,
        fill: 'green',
        draggable: true,
    });
    layer.add(rect);
    addTransformer(rect);
    layer.draw();
});

const addCircle = document.getElementById('add-circle');
addCircle.addEventListener('click', function () {
    const circle = new Konva.Circle({
        x: 100,
        y: 100,
        radius: 50,
        fill: 'red',
        draggable: true,
    });
    layer.add(circle);
    addTransformer(circle);
    layer.draw();
});

document.getElementById('add-star').addEventListener('click', function () {
    const star = new Konva.Star({
        x: 150,
        y: 150,
        numPoints: 5,
        innerRadius: 40,
        outerRadius: 70,
        fill: 'yellow',
        stroke: 'black',
        strokeWidth: 4,
        draggable: true,
    });
    layer.add(star);
    addTransformer(star);
    layer.draw();
});

document.getElementById('add-arrow').addEventListener('click', function () {
    const arrow = new Konva.Arrow({
        x: 200,
        y: 200,
        points: [0, 0, 100, 100],
        pointerLength: 20,
        pointerWidth: 20,
        fill: 'black',
        stroke: 'black',
        strokeWidth: 4,
        draggable: true,
    });
    layer.add(arrow);
    addTransformer(arrow);
    layer.draw();
});

// Template functionality
const addTemplate1 = document.getElementById('add-template-1');
addTemplate1.addEventListener('click', function () {
    // clear canvas
    layer.destroy();
    layer = new Konva.Layer(); // Re-initialize the global layer
    stage.add(layer);

    // add a background
    const background = new Konva.Rect({
        x: 0,
        y: 0,
        width: stage.width(),
        height: stage.height(),
        fill: '#f0f0f0',
    });
    layer.add(background);

    // add some text
    const text = new Konva.Text({
        text: 'TEMPLATE 1',
        x: 50,
        y: 50,
        fontSize: 40,
        fill: '#333',
        draggable: true,
    });
    layer.add(text);
    addTransformer(text);

    layer.draw();
});

// Frame functionality
const addFrame1 = document.getElementById('add-frame-1');
addFrame1.addEventListener('click', function () {
    const frame = new Konva.Rect({
        x: 150,
        y: 150,
        width: 200,
        height: 150,
        stroke: 'black',
        strokeWidth: 4,
        draggable: true,
    });
    layer.add(frame);
    addTransformer(frame);
    layer.draw();
});

// State Management
document.getElementById('save-btn').addEventListener('click', () => {
    const json = stage.toJSON();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(json);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "canvas.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
});

document.getElementById('load-btn').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
        const json = event.target.result;
        stage.destroy();
        stage = Konva.Node.create(json, 'container');
        layer = stage.findOne('Layer');

        // Re-attach transformers and event listeners
        layer.find('Rect, Circle, Text, Image, Group').forEach(node => {
            addTransformer(node);
        });

        stage.on('click tap', function (e) {
            // if click on empty area - remove all transformers
            if (e.target === stage) {
                layer.find('Transformer').forEach(tr => tr.nodes([]));
                updatePropertiesPanel(null); // Clear properties panel
                updateArrangePanel(null); // Clear arrange panel
                layer.draw();
                return;
            }
        });
    };
    reader.readAsText(file);
});

// Exporting
function downloadURI(uri, name) {
    const link = document.createElement('a');
    link.download = name;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    delete link;
}

// History
let history = [stage.toJSON()];
let historyStep = 0;

function saveHistory() {
    if (historyStep < history.length - 1) {
        history = history.slice(0, historyStep + 1);
    }
    history.push(stage.toJSON());
    historyStep++;
}

stage.on('mouseup touchend', saveHistory);
stage.on('dragend', saveHistory);
stage.on('transformend', saveHistory);

document.getElementById('undo-btn').addEventListener('click', () => {
    if (historyStep > 0) {
        historyStep--;
        const previous = history[historyStep];
        stage.destroy();
        stage = Konva.Node.create(previous, 'container');
        layer = stage.findOne('Layer');
        layer.find('Rect, Circle, Text, Image, Group').forEach(node => {
            addTransformer(node);
        });
        stage.on('click tap', function (e) {
            if (e.target === stage) {
                layer.find('Transformer').forEach(tr => tr.nodes([]));
                updatePropertiesPanel(null);
                updateArrangePanel(null);
                layer.draw();
            }
        });
    }
});

document.getElementById('redo-btn').addEventListener('click', () => {
    if (historyStep < history.length - 1) {
        historyStep++;
        const next = history[historyStep];
        stage.destroy();
        stage = Konva.Node.create(next, 'container');
        layer = stage.findOne('Layer');
        layer.find('Rect, Circle, Text, Image, Group').forEach(node => {
            addTransformer(node);
        });
        stage.on('click tap', function (e) {
            if (e.target === stage) {
                layer.find('Transformer').forEach(tr => tr.nodes([]));
                updatePropertiesPanel(null);
                updateArrangePanel(null);
                layer.draw();
            }
        });
    }
});

document.getElementById('export-png-btn').addEventListener('click', () => {
    const dataURL = stage.toDataURL({ pixelRatio: 3 });
    downloadURI(dataURL, 'canvas.png');
});

document.getElementById('export-jpeg-btn').addEventListener('click', () => {
    const dataURL = stage.toDataURL({ mimeType: 'image/jpeg', quality: 0.8, pixelRatio: 3 });
    downloadURI(dataURL, 'canvas.jpeg');
});

// Canvas Background
document.getElementById('canvas-bg-color').addEventListener('input', (e) => {
    stage.container().style.backgroundColor = e.target.value;
});
