import './style.css'

import { HandwritingSliderSVG } from './components/HandWritter';

const p='#ff8000';
const slider = new HandwritingSliderSVG({
  container: document.getElementById('canvasContainer'),
  slides: [
    {
        text: [
            [ { content: 'Пока с тобой, '}],
            [ { content: 'правда'} ],
            [ { content: 'не бойся'} ],
            [ { content: 'тварей!'} ],
            [ { content: 'Живя высшей'} ],
            [ { content: 'целью...'} ],
        ],
        fontSize: 62
    },
    {
        text: [
            [ { content: 'выбирай свой'}],
            [ { content: 'сценарий. Сквозь'} ],
            [ { content: 'метель иди в'},  ],
            [ { content: 'одиночку ',color:p}, { content: ' даже'} ],
            [ { content: 'ведь, если'} ],
        ],
        fontSize: 62
    },
    {
        text: [
            [ { content: 'в сердце огонь,'}],
            [ { content: 'то холод'} ],
            [ { content: 'не страшен.'},],
            [ { content: 'Через поля'} ],
            [ { content: 'сражений'} ],
            [ { content: 'в стальном'} ],
            [ { content: 'свете'} ],
            [ { content: 'и по росе'} ],
        ],
        fontSize: 58
    },
    {
        text: [
            [ { content: 'предрассветной'}],
            [ { content: 'выше столетий'} ],
            [ { content: 'знай в яме тёмной'},],
            [ { content: 'или в поисках'} ],
            [ { content: 'мы с тобой,'} ],
            [ { content: 'сын,', color:p} ],
            [ { content: 'и с нами', color:p} ],
            [ { content: 'небесное войско!', color:p} ],
        ],
        fontSize: 54
    },
  ],
  fontUrl: '/fnt/AlumniSansPinstripe-Regular.ttf',
  speed: .3,
  pause: 0,
  color: '#fff',
  autoScroll: false,
  autoScrollDelay: 1000,
  onComplete: (index) => {
    console.log(`Слайд ${index} написан полностью`);
  }
});

/////// WEBGL
const canvasEl = document.querySelector("canvas#neuro");
const devicePixelRatio = Math.min(window.devicePixelRatio, 2);


const pointer = {
    x: 0,
    y: 0,
    tX: 0,
    tY: 0,
};


let uniforms;
const gl = initShader();

setupEvents();

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

render();

function initShader() {
  const d=document
    , vsSource = d.getElementById("vertShader").innerHTML
    , fsSource = d.getElementById("fragShader").innerHTML
    ;

    const gl = canvasEl.getContext("webgl") || canvasEl.getContext("experimental-webgl");

    if (!gl) {
        alert("WebGL is not supported by your browser.");
    }

    function createShader(gl, sourceCode, type) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, sourceCode);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    const vertexShader = createShader(gl, vsSource, gl.VERTEX_SHADER);
    const fragmentShader = createShader(gl, fsSource, gl.FRAGMENT_SHADER);

    function createShaderProgram(gl, vertexShader, fragmentShader) {
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error("Unable to initialize the shader program: " + gl.getProgramInfoLog(program));
            return null;
        }

        return program;
    }

    const shaderProgram = createShaderProgram(gl, vertexShader, fragmentShader);
    uniforms = getUniforms(shaderProgram);

    function getUniforms(program) {
        let uniforms = [];
        let uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < uniformCount; i++) {
            let uniformName = gl.getActiveUniform(program, i).name;
            uniforms[uniformName] = gl.getUniformLocation(program, uniformName);
        }
        return uniforms;
    }

    const vertices = new Float32Array([-1., -1., 1., -1., -1., 1., 1., 1.]);

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    gl.useProgram(shaderProgram);

    const positionLocation = gl.getAttribLocation(shaderProgram, "a_position");
    gl.enableVertexAttribArray(positionLocation);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    return gl;
}

function render() {
    const currentTime = performance.now();

    pointer.x += (pointer.tX - pointer.x) * .2;
    pointer.y += (pointer.tY - pointer.y) * .2;

    gl.uniform1f(uniforms.u_time, currentTime);
    gl.uniform2f(uniforms.u_pointer_position, pointer.x / window.innerWidth, 1 - pointer.y / window.innerHeight);
    gl.uniform1f(uniforms.u_scroll_progress, window["pageYOffset"] / (2 * window.innerHeight));

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(render);
}

function resizeCanvas() {
    canvasEl.width = window.innerWidth * devicePixelRatio;
    canvasEl.height = window.innerHeight * devicePixelRatio;
    gl.uniform1f(uniforms.u_ratio, canvasEl.width / canvasEl.height);
    gl.viewport(0, 0, canvasEl.width, canvasEl.height);
}

function setupEvents() {
    window.addEventListener("pointermove", e => {
        updateMousePosition(e.clientX, e.clientY);
    });
    window.addEventListener("touchmove", e => {
        updateMousePosition(e.targetTouches[0].clientX, e.targetTouches[0].clientY);
    });
    window.addEventListener("click", e => {
        updateMousePosition(e.clientX, e.clientY);
    });

    function updateMousePosition(eX, eY) {
        pointer.tX = eX;
        pointer.tY = eY;
    }
}
