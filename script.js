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
const layer = new Konva.Layer();

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
    layer.add(tr);
    layer.draw();

    shape.on('click tap', () => {
        // remove existing transformers
        layer.find('Transformer').forEach(t => t.destroy());

        // create new transformer
        const newTr = new Konva.Transformer({
            nodes: [shape],
        });
        layer.add(newTr);
        layer.draw();
    });
}

// Deselect shapes when clicking on the stage
stage.on('click tap', function (e) {
    // if click on empty area - remove all transformers
    if (e.target === stage) {
        layer.find('Transformer').forEach(tr => tr.destroy());
        layer.draw();
        return;
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
        // create textarea over canvas, in position of text
        const textPosition = textNode.getAbsolutePosition();
        const stageBox = stage.container().getBoundingClientRect();

        const areaPosition = {
            x: stageBox.left + textPosition.x,
            y: stageBox.top + textPosition.y,
        };

        const textarea = document.createElement('textarea');
        document.body.appendChild(textarea);

        textarea.value = textNode.text();
        textarea.style.position = 'absolute';
        textarea.style.top = areaPosition.y + 'px';
        textarea.style.left = areaPosition.x + 'px';
        textarea.style.width = textNode.width() - textNode.padding() * 2 + 'px';
        textarea.style.height = textNode.height() - textNode.padding() * 2 + 5 + 'px';
        textarea.style.fontSize = textNode.fontSize() + 'px';
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
        const rotation = textNode.rotation();
        let transform = '';
        if (rotation) {
            transform += 'rotateZ(' + rotation + 'deg)';
        }

        textarea.style.transform = transform;
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 3 + 'px';
        textarea.focus();

        function removeTextarea() {
            textarea.parentNode.removeChild(textarea);
            window.removeEventListener('click', handleOutsideClick);
            textNode.show();
            layer.draw();
        }

        function setTextareaWidth(newWidth) {
            if (!newWidth) {
                // set width for placeholder
                newWidth = textNode.placeholder.length * textNode.fontSize();
            }
            const isSafari = /^((?!chrome|android).)*safari/i.test(
                navigator.userAgent
            );
            const isFirefox =
                navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
            if (isSafari || isFirefox) {
                newWidth = Math.ceil(newWidth);
            }
            textarea.style.width = newWidth + 'px';
        }

        textarea.addEventListener('keydown', function (e) {
            // hide on enter
            // but don't hide on shift + enter
            if (e.keyCode === 13 && !e.shiftKey) {
                textNode.text(textarea.value);
                removeTextarea();
            }
            // on esc do not set value
            if (e.keyCode === 27) {
                removeTextarea();
            }

            const scale = textNode.getAbsoluteScale().x;
            setTextareaWidth(textNode.width() * scale);
            textarea.style.height = 'auto';
            textarea.style.height =
                textarea.scrollHeight + textNode.fontSize() + 'px';
        });

        function handleOutsideClick(e) {
            if (e.target !== textarea) {
                textNode.text(textarea.value);
                removeTextarea();
            }
        }
        setTimeout(() => {
            window.addEventListener('click', handleOutsideClick);
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
