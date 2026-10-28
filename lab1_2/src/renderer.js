import { onBtnClick, state } from "./main.ts"

let GL = null;
let lastMouse = { x: 0, y: 0 };

const COORDS = 0;
let program, uniforms;

let cameraPos = [0, 1, 5];

let yaw = 0;
let target_yaw = 0;
let pitch = 0;
let target_pitch = 0;
const camSpeed = 0.002;

const bc = 0.4
const buttonColor = [bc,bc,bc,1]
const hc = 0.9
const hoverColor = [hc,hc,hc,1]
const calculatorScale = 0.5
const buttonSize = [0.2, 0.2, 0.2]

onload = () => {
    const canvas = document.getElementById("CANVAS");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    GL = canvas.getContext("webgl2");
    if (!GL) return;

    ({ program, uniforms } = setupScene());

    document.onmousemove = e => {
        lastMouse = { x: e.clientX, y: e.clientY };
        const rect = GL.canvas.getBoundingClientRect();
        target_yaw = ((e.clientX - rect.width * 0.5) * -0.00025) 
        target_pitch = ((e.clientY - rect.height * 0.5) * 0.00025)
        if (document.pointerLockElement !== canvas) return;
        lastMouse = {x: rect.width / 2, y: rect.height / 2};

        yaw -= e.movementX * camSpeed;
        pitch += e.movementY * camSpeed;

        pitch = Math.max(-1.57, Math.min(1.57, pitch));
    };
    document.onmousedown = () => keys.pressed = true;
    document.onmouseup = () => {keys.pressed = false; keys.click = false};
    document.onclick = () => keys.click = true;

    const matrix = [
        ["clear", "pow", "sqrt", "div"],
        ["7", "8", "9", "mul"],
        ["4", "5", "6", "sub"],
        ["1", "2", "3", "add"],
        ["0","0", "dot", "eq"]
    ]
    var centerX = (matrix[0].length - 1) / 2.0
    var centerY = (matrix.length - 1) / 2.0

    for (var y=0;y<matrix.length;y++) {
        for (var x=0;x<matrix[0].length;x++) {
            var posX = (x - centerX) * calculatorScale
            var posY = -(y - centerY) * calculatorScale
            createCube(matrix[y][x], [posX, posY, 0], buttonSize, buttonColor);
        }
    }

    requestAnimationFrame(loop);
};

var keys = {
    click: false,
    pressed: false
}

var prevT = 0
function loop(time) {
    let dt = Math.min((time-prevT) / 1000, 0.1);
    prevT = time;

    yaw = lerp(yaw, target_yaw, dt * 10.0);
    pitch = lerp(pitch, target_pitch, dt * 10.0);

    const aspect = processResize();

    GL.clearColor(0, 0, 0, 1);
    GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    GL.useProgram(program);

    const view = getViewMatrix(cameraPos, yaw, pitch);
    const proj = getProjectionMatrix(aspect);
    const vp = multiply(proj, view);
    const invVP = invert(vp);

    GL.uniformMatrix4fv(uniforms.vp, false, vp);
    if (!Number.isFinite(Number.parseFloat(state.value))) return

    tickCubes(dt);

    const ndc = getMouseNDC(lastMouse);
    const ray = getRay(ndc, invVP);


    for (var i in cubes) {
        var cube = cubes[i];
        const hit = rayBox(ray, cube);
        drawCube(cube);
        drawGlyph(i, cube.pos, cube.size[0] * 0.4, cube.color);
        if (hit) {
            if (keys.pressed) {
                cube.target_size = [0.18, 0.18, 0.18];
            } else {
                cube.target_size = [0.3, 0.3, 0.3];
            }
            cube.target_color = hoverColor;
        } else {
            cube.target_size = cube.origin_size;
            cube.target_color = cube.origin_color;
        }
        if (hit && keys.click){
            onBtnClick(i)
        }
    }
    keys.click = false;
    displayState()
    requestAnimationFrame(loop);
}

function displayState(){
    var current = state.value
    var prev = state.stored
    drawGlyphSequence(current, [0, 1.6, 0], 0.1)
    if (prev !== null) {
        drawGlyphSequence(String(prev).split(''), [0, 2.4, 0], 0.08, [0.7, 0.7, 0.7, 1])
        drawGlyphSequence([state.operation.name], [0, 2.0, 0], 0.04, [0.7, 0.7, 0.7, 1])
    }
}

function drawGlyphSequence(glyphs, pos, scale, color=[1, 1, 1, 1]) {
    var currentX = (glyphs.length - 1) / 2.0
    for (var x=0;x<glyphs.length;x++) {
        var glyph = glyphs[x]
        var posX = (x - currentX) * calculatorScale
        drawGlyph(glyph, [posX + pos[0], pos[1], pos[2]], scale, color);
    }
}

var cubes = {}

function createCube(id, pos, size, color=[1,1,1,1], aabb=size){
    cubes[id] = {
        pos:pos, 
        target_pos:pos, 
        size:size, 
        target_size:size, 
        aabb: size,
        color:color,
        target_color:color,
        origin_color:color,
        origin_pos:pos,
        origin_size:size,
        vbo: GL.createBuffer(),
    };
}

function tickCubes(dt){
    for (var i in cubes) {
        var cube = cubes[i];

        cube.pos = interpolateVec3(cube.pos, cube.target_pos, dt * 10.0);
        cube.size = interpolateVec3(cube.size, cube.target_size, dt * 10.0);
        cube.color = interpolateVec4(cube.color, cube.target_color, dt * 10.0);
    }
}


const interpolationFn = lerp

function lerp(a, b, dt){
    return a + (b - a) * dt;
}

function interpolateVec4(origin, target, dt){
    return [
        interpolationFn(origin[0], target[0], dt),
        interpolationFn(origin[1], target[1], dt),
        interpolationFn(origin[2], target[2], dt),
        interpolationFn(origin[3], target[3], dt)
    ]
}

function interpolateVec3(origin, target, dt){
    return [
        lerp(origin[0], target[0], dt),
        lerp(origin[1], target[1], dt),
        lerp(origin[2], target[2], dt)
    ]
}



//#region glyphs

var o = 0
let glyph_missed = [
    [
        o, o, 2, o, o,
        o, 1, o, 3, o,
        o, o, o, o, o,
        o, 1, o, 4, o,
        o, o, 5, o, o
    ],
    [
        1, o, o, o, o,
        o, o, o, o, o,
        o, o, o, o, o,
        o, o, o, o, o,
        o, o, o, o, 2
    ],
    [
        o, o, o, o, o,
        o, o, o, o, o,
        1, o, o, o, 2,
        o, o, o, o, o,
        o, o, o, o, o
    ],
    [
        o, o, o, o, 1,
        o, o, o, o, o,
        o, o, o, o, o,
        o, o, o, o, o,
        2, o, o, o, o
    ]
]
let glyph_zero = [[
    o, o, 1, o, o,
    o, 1, o, 2, o,
    o, o, o, 3, o,
    o, 6, o, 4, o,
    o, o, 5, o, o
]]
let glyph_one = [[
    o, o, 2, o, o,
    o, 1, 3, o, o,
    o, o, 4, o, o,
    o, o, 5, o, o,
    o, o, 6, o, o
]]
let glyph_two = [[
    o, o, 2, o, o,
    o, 1, o, 3, o,
    o, o, o, 4, o,
    o, o, 5, o, o,
    o, 6, 7, 8, o
]]
let glyph_three = [[
    o, o, 2, o, o,
    o, 1, o, 3, o,
    o, o, 4, o, o,
    o, 7, o, 5, o,
    o, o, 6, o, o
]]
let glyph_four = [[
    o, o, o, 1, o,
    o, o, o, o, o,
    o, 2, o, 3, o,
    o, o, o, o, o,
    o, o, o, 1, o
]]
let glyph_five = [[
    o, 3, 2, 1, o,
    o, o, o, o, o,
    o, 4, 5, 6, o,
    o, o, o, 7, o,
    o, 9, 8, o, o
]]
let glyph_six = [[
    o, o, 2, 1, o,
    o, 3, o, o, o,
    o, 8, o, 7, o,
    o, o, o, 6, o,
    o, 4, 5, o, o
]]
let glyph_seven = [[
    o, 1, 2, 3, o,
    o, o, o, 4, o,
    o, o, 5, o, o,
    o, o, 6, o, o,
    o, o, 7, o, o
]]
let glyph_eight = [[
    o, o, 1, o, o,
    o, 1, o, 2, o,
    o, o, 6, o, o,
    o, 3, o, 5, o,
    o, o, 4, o, o
]]
let glyph_nine = [[
    o, o, 4, o, o,
    o, 3, o, 5, o,
    o, o, 2, 1, o,
    o, 8, o, 6, o,
    o, o, 7, o, o
]]
let glyph_dot = [
    [
        o, o, o, o, o,
        o, o, o, o, o,
        o, o, o, o, o,
        o, o, 1, o, o,
        o, o, 2, o, o
    ]
]
let glyph_add = [
    [
        o, o, o, o, o,
        o, o, o, o, o,
        1, o, o, o, 2,
        o, o, o, o, o,
        o, o, o, o, o
    ],
    [
        o, o, 1, o, o,
        o, o, o, o, o,
        o, o, o, o, o,
        o, o, o, o, o,
        o, o, 2, o, o
    ]
]
let glyph_sub = [
    [
        o, o, o, o, o,
        o, o, o, o, o,
        1, o, o, o, 2,
        o, o, o, o, o,
        o, o, o, o, o
    ]
]
let glyph_mul = [
    [
        1, o, o, o, o,
        o, o, o, o, o,
        o, o, o, o, o,
        o, o, o, o, o,
        o, o, o, o, 2
    ],
    [
        o, o, o, o, 2,
        o, o, o, o, o,
        o, o, o, o, o,
        o, o, o, o, o,
        1, o, o, o, o
    ]
]
let glyph_div = [
    [
        o, o, o, 1, o,
        o, o, o, o, o,
        o, o, o, o, o,
        o, o, o, o, o,
        o, 2, o, o, o
    ]
]
let glyph_pow = [
    [
        o, o, 2, o, o,
        o, o, o, o, o,
        1, o, o, o, 3,
        o, o, o, o, o,
        o, o, o, o, o
    ]
]
let glyph_sqrt = [
    [
        o, o, 3, o, 4,
        o, o, o, o, o,
        o, o, o, o, o,
        1, o, o, o, o,
        o, 2, o, o, o
    ]
]
let glyph_clear = [
    [
        o, o, 2, o, o,
        o, 3, o, 1, o,
        o, o, o, o, o,
        o, 4, o, 6, o,
        o, o, 5, o, o,
    ]
]
let glyph_eq = [
    [
        o, o, o, o, o,
        2, o, o, o, 1,
        o, o, o, o, o,
        o, o, o, o, o,
        o, o, o, o, o
    ],
    [
        o, o, o, o, o,
        o, o, o, o, o,
        o, o, o, o, o,
        2, o, o, o, 1,
        o, o, o, o, o
    ]
]
let glyph_e = [
    [
        o, o, o, o, o,
        o, o, 2, o, o,
        o, 3, o, 1, o,
        o, 4, o, 6, o,
        o, o, 5, o, o
    ],
    [
        o, o, o, o, o,
        o, o, o, o, o,
        o, 2, o, 1, o,
        o, o, o, o, o,
        o, o, o, o, o
    ]
]
//#endregion



// const cubeVBO = GL.createBuffer()
// const glyphVBO = GL.createBuffer()
var glyph_vbo = {}
function drawGlyph(glyph, pos, scale, color) {
    const layers = buildGlyphLines(glyph, pos, scale);
    for (const buffer of layers) {
        if (buffer.length === 0) continue;

        GL.uniform4fv(uniforms.color, color);
        var vbo = glyph_vbo[glyph]
        if (!vbo) {
            vbo = GL.createBuffer()
            glyph_vbo[glyph] = vbo
        }
        GL.bindBuffer(GL.ARRAY_BUFFER, vbo);
        GL.bufferData(GL.ARRAY_BUFFER, buffer, GL.STATIC_DRAW);

        GL.vertexAttribPointer(COORDS, 3, GL.FLOAT, false, 0, 0);
        GL.enableVertexAttribArray(COORDS);
        GL.drawArrays(GL.LINES, 0, buffer.length / 3);
    }
}

function buildGlyphLines(glyph, pos, scale) {
    const glyph_data = glyphData(glyph);

    const layers = [];

    for (const layer of glyph_data) {
        const verts = [];
        const points = [];
        const ones = [];

        const founded = []
        for (let i = 1; i < 25; i++) {
            let idx = 0
            for (let j = 0; j < 25; j++) {
                if (layer[j] === i) {
                    founded.push(j)
                    idx = j;
                    break
                }
            }

            if (layer[idx] !== 0) {
                const v = getGlyphVertex(idx, pos, scale);
                points.push(v);
                if (layer[idx] === 1) {
                    ones.push(v);
                }
            } else {
                break
            }
        }
        let c = 0
        for (let j = 0; j < 25; j++) {
            if (layer[j] === 1) {
                c++
                if (c == 2) {
                    const v = getGlyphVertex(j, pos, scale);
                    ones.push(v);
                    break
                }
            }
        }

        for (let i = 0; i < points.length - 1; i++) {
            verts.push(
                points[i][0], points[i][1], points[i][2],
                points[i + 1][0], points[i + 1][1], points[i + 1][2]
            );
        }
        if (ones.length === 2) {
            let last = points[points.length - 1]
            verts.push(
                last[0], last[1], last[2],
                ones[1][0], ones[1][1], ones[1][2]
            )
            verts.push(
                ones[1][0], ones[1][1], ones[1][2],
                ones[0][0], ones[0][1], ones[0][2]
            );
        }

        layers.push(new Float32Array(verts));
    }

    return layers;
}

function getGlyphVertex(idx, pos = [0,0], scale = 1) {
    let x = (idx % 5) - 2;
    let y = -Math.floor(idx / 5) + 2;
    return [
        pos[0] + x * scale,
        pos[1] + y * scale,
        0
    ];
}

function glyphData(digit){
    switch (digit) {
        case "0": case 0: return glyph_zero
        case "1": case 1: return glyph_one
        case "2": case 2: return glyph_two
        case "3": case 3: return glyph_three
        case "4": case 4: return glyph_four
        case "5": case 5: return glyph_five
        case "6": case 6: return glyph_six
        case "7": case 7: return glyph_seven
        case "8": case 8: return glyph_eight
        case "9": case 9: return glyph_nine
        case ".": case "dot": return glyph_dot
        case "+": case "add": return glyph_add
        case "e": return glyph_e
        case "-": case "sub": return glyph_sub
        case "mul": return glyph_mul
        case "div": return glyph_div
        case "pow": return glyph_pow
        case "sqrt": return glyph_sqrt
        case "eq": return glyph_eq
        case "clear": return glyph_clear
    }
    return []
}


//#region utils

function getMouseNDC(e) {
    const rect = GL.canvas.getBoundingClientRect();
    return {
        x: ((e.x - rect.left) / rect.width) * 2 - 1,
        y: ((rect.bottom - e.y) / rect.height) * 2 - 1
    };
}


function getRay(ndc, invVP) {
    const p0 = transform(invVP, [ndc.x, ndc.y, -1, 1]);
    const p1 = transform(invVP, [ndc.x, ndc.y, 1, 1]);

    const origin = divideW(p0);
    const end = divideW(p1);

    let dir = [
        end[0] - origin[0],
        end[1] - origin[1],
        end[2] - origin[2]
    ];

    const len = Math.hypot(...dir);
    dir = dir.map(v => v / len);

    return { origin, dir };
}

function rayBox(ray, cube) {
    const min = cube.pos.map((v, i) => v - cube.aabb[i]);
    const max = cube.pos.map((v, i) => v + cube.aabb[i]);

    let tmin = -Infinity;
    let tmax = Infinity;

    for (let i = 0; i < 3; i++) {
        const invD = 1 / ray.dir[i];
        let t0 = (min[i] - ray.origin[i]) * invD;
        let t1 = (max[i] - ray.origin[i]) * invD;

        if (invD < 0) [t0, t1] = [t1, t0];

        tmin = Math.max(tmin, t0);
        tmax = Math.min(tmax, t1);

        if (tmax < tmin) return false;
    }

    return true;
}
function drawCube(c) {
    GL.uniform4fv(uniforms.color, c.color);

    const s = c.size;
    const p = c.pos;

    const v = [
        [-s[0]+p[0], -s[1]+p[1], -s[2]+p[2]],
        [ s[0]+p[0], -s[1]+p[1], -s[2]+p[2]],
        [ s[0]+p[0],  s[1]+p[1], -s[2]+p[2]],
        [-s[0]+p[0],  s[1]+p[1], -s[2]+p[2]],

        [-s[0]+p[0], -s[1]+p[1],  s[2]+p[2]],
        [ s[0]+p[0], -s[1]+p[1],  s[2]+p[2]],
        [ s[0]+p[0],  s[1]+p[1],  s[2]+p[2]],
        [-s[0]+p[0],  s[1]+p[1],  s[2]+p[2]],
    ];

    const edges = [
        0,1, 1,2, 2,3, 3,0,
        4,5, 5,6, 6,7, 7,4,
        0,4, 1,5, 2,6, 3,7
    ];

    let arr = [];
    for (let i=0;i<edges.length;i++){
        arr.push(...v[edges[i]]);
    }

    const buffer = Float32Array.from(arr);

    GL.bindBuffer(GL.ARRAY_BUFFER, c.vbo);
    GL.bufferData(GL.ARRAY_BUFFER, buffer, GL.STATIC_DRAW);
    GL.vertexAttribPointer(COORDS, 3, GL.FLOAT, false, 0, 0);
    GL.enableVertexAttribArray(COORDS);

    GL.drawArrays(GL.LINES, 0, buffer.length/3);
}

// ---------- MATH ----------

function getProjectionMatrix(aspect) {
    const fov = Math.PI / 3; // 60 градусов
    const near = 0.1;
    const far = 100;
    const f = 1 / Math.tan(fov / 2);

    return [
        f/aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far+near)/(near-far), -1,
        0, 0, (2*far*near)/(near-far), 0
    ];
}

function getViewMatrix(pos, yaw, pitch) {
    const cx = Math.cos(pitch), sx = Math.sin(pitch);
    const cy = Math.cos(yaw), sy = Math.sin(yaw);

    const dir = [
        -sy * cx,
        -sx,
        -cy * cx
    ];

    const target = [
        pos[0] + dir[0],
        pos[1] + dir[1],
        pos[2] + dir[2]
    ];

    return lookAt(pos, target, [0,1,0]);
}

function lookAt(eye, center, up) {
    const z = normalize(sub(eye, center));
    const x = normalize(cross(up, z));
    const y = cross(z, x);

    return [
        x[0], y[0], z[0], 0,
        x[1], y[1], z[1], 0,
        x[2], y[2], z[2], 0,
        -dot(x,eye), -dot(y,eye), -dot(z,eye), 1
    ];
}

function multiply(a, b) {
    const out = new Array(16);

    for (let i = 0; i < 4; i++) {        // column
        for (let j = 0; j < 4; j++) {    // row
            out[i*4 + j] =
                a[0*4 + j] * b[i*4 + 0] +
                a[1*4 + j] * b[i*4 + 1] +
                a[2*4 + j] * b[i*4 + 2] +
                a[3*4 + j] * b[i*4 + 3];
        }
    }

    return out;
}

function invert(m) {
    const inv = new Float32Array(16);
    const a = m;

    inv[0] = a[5]  * a[10] * a[15] - 
             a[5]  * a[11] * a[14] - 
             a[9]  * a[6]  * a[15] + 
             a[9]  * a[7]  * a[14] +
             a[13] * a[6]  * a[11] - 
             a[13] * a[7]  * a[10];

    inv[4] = -a[4]  * a[10] * a[15] + 
              a[4]  * a[11] * a[14] + 
              a[8]  * a[6]  * a[15] - 
              a[8]  * a[7]  * a[14] - 
              a[12] * a[6]  * a[11] + 
              a[12] * a[7]  * a[10];

    inv[8] = a[4]  * a[9] * a[15] - 
             a[4]  * a[11] * a[13] - 
             a[8]  * a[5] * a[15] + 
             a[8]  * a[7] * a[13] + 
             a[12] * a[5] * a[11] - 
             a[12] * a[7] * a[9];

    inv[12] = -a[4]  * a[9] * a[14] + 
               a[4]  * a[10] * a[13] +
               a[8]  * a[5] * a[14] - 
               a[8]  * a[6] * a[13] - 
               a[12] * a[5] * a[10] + 
               a[12] * a[6] * a[9];

    inv[1] = -a[1]  * a[10] * a[15] + 
              a[1]  * a[11] * a[14] + 
              a[9]  * a[2] * a[15] - 
              a[9]  * a[3] * a[14] - 
              a[13] * a[2] * a[11] + 
              a[13] * a[3] * a[10];

    inv[5] = a[0]  * a[10] * a[15] - 
             a[0]  * a[11] * a[14] - 
             a[8]  * a[2] * a[15] + 
             a[8]  * a[3] * a[14] + 
             a[12] * a[2] * a[11] - 
             a[12] * a[3] * a[10];

    inv[9] = -a[0]  * a[9] * a[15] + 
              a[0]  * a[11] * a[13] + 
              a[8]  * a[1] * a[15] - 
              a[8]  * a[3] * a[13] - 
              a[12] * a[1] * a[11] + 
              a[12] * a[3] * a[9];

    inv[13] = a[0]  * a[9] * a[14] - 
              a[0]  * a[10] * a[13] - 
              a[8]  * a[1] * a[14] + 
              a[8]  * a[2] * a[13] + 
              a[12] * a[1] * a[10] - 
              a[12] * a[2] * a[9];

    inv[2] = a[1]  * a[6] * a[15] - 
             a[1]  * a[7] * a[14] - 
             a[5]  * a[2] * a[15] + 
             a[5]  * a[3] * a[14] + 
             a[13] * a[2] * a[7] - 
             a[13] * a[3] * a[6];

    inv[6] = -a[0]  * a[6] * a[15] + 
              a[0]  * a[7] * a[14] + 
              a[4]  * a[2] * a[15] - 
              a[4]  * a[3] * a[14] - 
              a[12] * a[2] * a[7] + 
              a[12] * a[3] * a[6];

    inv[10] = a[0]  * a[5] * a[15] - 
              a[0]  * a[7] * a[13] - 
              a[4]  * a[1] * a[15] + 
              a[4]  * a[3] * a[13] + 
              a[12] * a[1] * a[7] - 
              a[12] * a[3] * a[5];

    inv[14] = -a[0]  * a[5] * a[14] + 
               a[0]  * a[6] * a[13] + 
               a[4]  * a[1] * a[14] - 
               a[4]  * a[2] * a[13] - 
               a[12] * a[1] * a[6] + 
               a[12] * a[2] * a[5];

    inv[3] = -a[1] * a[6] * a[11] + 
              a[1] * a[7] * a[10] + 
              a[5] * a[2] * a[11] - 
              a[5] * a[3] * a[10] - 
              a[9] * a[2] * a[7] + 
              a[9] * a[3] * a[6];

    inv[7] = a[0] * a[6] * a[11] - 
             a[0] * a[7] * a[10] - 
             a[4] * a[2] * a[11] + 
             a[4] * a[3] * a[10] + 
             a[8] * a[2] * a[7] - 
             a[8] * a[3] * a[6];

    inv[11] = -a[0] * a[5] * a[11] + 
               a[0] * a[7] * a[9] + 
               a[4] * a[1] * a[11] - 
               a[4] * a[3] * a[9] - 
               a[8] * a[1] * a[7] + 
               a[8] * a[3] * a[5];

    inv[15] = a[0] * a[5] * a[10] - 
              a[0] * a[6] * a[9] - 
              a[4] * a[1] * a[10] + 
              a[4] * a[2] * a[9] + 
              a[8] * a[1] * a[6] - 
              a[8] * a[2] * a[5];

    let det = a[0]*inv[0] + a[1]*inv[4] + a[2]*inv[8] + a[3]*inv[12];
    if (!det) return m;

    det = 1.0 / det;
    for (let i = 0; i < 16; i++) inv[i] *= det;

    return inv;
}


function transform(m, v) {
    return [
        m[0]*v[0]+m[4]*v[1]+m[8]*v[2]+m[12]*v[3],
        m[1]*v[0]+m[5]*v[1]+m[9]*v[2]+m[13]*v[3],
        m[2]*v[0]+m[6]*v[1]+m[10]*v[2]+m[14]*v[3],
        m[3]*v[0]+m[7]*v[1]+m[11]*v[2]+m[15]*v[3]
    ];
}

function divideW(v){
    return [v[0]/v[3], v[1]/v[3], v[2]/v[3]];
}

function sub(a,b){return a.map((v,i)=>v-b[i])}
function dot(a,b){return a.reduce((s,v,i)=>s+v*b[i],0)}
function cross(a,b){
    return [
        a[1]*b[2]-a[2]*b[1],
        a[2]*b[0]-a[0]*b[2],
        a[0]*b[1]-a[1]*b[0]
    ];
}
function normalize(v){
    const l=Math.hypot(...v);
    return v.map(x=>x/l);
}

// ---------- GL ----------

function setupScene() {
    const vs = `#version 300 es
    in vec3 coord;
    uniform mat4 vp;
    void main(){
        gl_Position = vp * vec4(coord,1.0);
    }`;

    const fs = `#version 300 es
    precision highp float;
    uniform vec4 color;
    out vec4 frag;
    void main(){
        frag = color;
    }`;

    const program = buildProgram(vs, fs);
    GL.enable(GL.DEPTH_TEST);

    return {
        program,
        uniforms: {
            vp: GL.getUniformLocation(program, "vp"),
            color: GL.getUniformLocation(program, "color")
        }
    };
}

function buildProgram(vs, fs) {
    const p = GL.createProgram();
    GL.attachShader(p, compile(vs, GL.VERTEX_SHADER));
    GL.attachShader(p, compile(fs, GL.FRAGMENT_SHADER));
    GL.linkProgram(p);
    return p;
}

function compile(src, type) {
    const s = GL.createShader(type);
    GL.shaderSource(s, src);
    GL.compileShader(s);
    return s;
}

function processResize() {
    const w = GL.canvas.clientWidth;
    const h = GL.canvas.clientHeight;
    GL.canvas.width = w;
    GL.canvas.height = h;
    GL.viewport(0,0,w,h);
    return w/h;
}

// #endregion
