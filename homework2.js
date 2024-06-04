"use strict";

var canvas;
var gl;
var program1, program2;

var projectionMatrix;
var modelViewMatrix;
var cameraMatrix;
var instanceMatrix;

var modelViewMatrixLoc;
var cameraMatrixLoc;

var background_color = [216/255, 189/255, 175/255, 1];

/********************   CAMERA   ********************/
var at = vec3(-2.0, 2.5, 0.0);
const up = vec3(0.0, 1.0, 0.0);

var eye_theta = -10.0;
var viewer_distance = 26.0;
var viewer_height = 11.5;
var eye = vec3(Math.sin(eye_theta*(Math.PI/180))*viewer_distance + at[0], viewer_height, Math.cos(eye_theta*(Math.PI/180))*viewer_distance + at[2]);


var near = 0.1;
var far = 200;
var fov = 60.0;
var aspect;


/************* LIGHTS *************/
var lightPosition = vec4(-10.0, 12.0, 6.0, 1.0);
var lightAmbient = vec4(0.15, 0.15, 0.15, 1.0);
var lightDiffuse = vec4(0.85, 0.85, 0.85, 1.0);
var lightSpecular = vec4(0.4, 0.4, 0.4, 1.0);

var materialAmbientLoc;
var materialDiffuseLoc;
var materialSpecularLoc;
var materialShininessLoc;


/**** Material properties ****/

// Cat:
const materialAmbientCat = vec4(0.9, 0.89, 0.88, 1.0);
const materialDiffuseCat = vec4(0.9, 0.89, 0.88, 1.0);      // light gray
const materialSpecularCat = vec4(0.0, 0.0, 0.0, 1.0);       // non reflective
const materialShininessCat = 200.0;

// Carpet:
const materialAmbientCarpet = vec4(0.2, 0.2, 0.2, 1.0);
const materialDiffuseCarpet = vec4(0.2, 0.2, 0.2, 1.0);     // dark gray
const materialSpecularCarpet = vec4(0.1, 0.1, 0.1, 1.0);    // non reflective
const materialShininessCarpet = 150.0;

// Table:
const materialAmbientTable = vec4(121.0/255.0, 71.0/255.0, 52.0/255.0, 1.0);   
const materialDiffuseTable = vec4(121.0/255.0, 71.0/255.0, 52.0/255.0, 1.0);    // brown
const materialSpecularTable = vec4(1.0, 0.8, 0.6, 1.0);     // yellow reflection
const materialShininessTable = 60.0;


/************* POSITIONS, NORMALS, ETC *************/

var vertices = [
    vec4( -0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5, -0.5, -0.5, 1.0 ),
    vec4( -0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5, -0.5, -0.5, 1.0 )
];

// IDs
const torsoId = 0;
const torso2Id = 10;
const headId  = 1;
const leftUpperArmId = 2;
const leftLowerArmId = 3;
const rightUpperArmId = 4;
const rightLowerArmId = 5;
const leftUpperLegId = 6;
const leftLowerLegId = 7;
const rightUpperLegId = 8;
const rightLowerLegId = 9;
const tail1Id = 11;
const tail2Id = 12;
const tail3Id = 13;
const carpetId = 14;
const tableId = 15;

const dxId = 14;        // same as carpetId but it's not a problem because the carpet doesn't move
const dyId = 15;        // same as carpetId but etc..
const dzId = 16;

const legsTranslationId = 17;
const tail1RotYId = 18;
const tail2RotYId = 19;
const tail3RotYId = 20;
const bodyVertScaleId = 21;

/* 
    Note about the parameters:
     X = Length
     Y = Height
     Z = Width
*/

// Parameters
var torsoLength = 3.4;
var torsoHeight = 1.5;
var torsoWidth = 2.0;

var headLength = 1.6;
var headHeight = 1.7;
var headWidth = 2.08;

var upperArmLength = 0.6;
var upperArmHeight = 0.9;
var upperArmWidth  = 0.5;

var lowerArmLength = 0.6;
var lowerArmHeight = 1.0;
var lowerArmWidth  = 0.5;

var upperLegLength = 1.1;
var upperLegHeight = 1.1;
var upperLegWidth  = 0.5;

var lowerLegLength = 0.6;
var lowerLegHeight = 1.2;
var lowerLegWidth  = 0.5;

var tailLength = 1.0;
var tailWidth = 0.5;

var tableTopLength = 13;
var tableTopHeight = 0.8;
var tableTopWidth = 10.0;
var tableLegWidth = 0.8;
var tableLegHeight = 6.0;

var overlap = 0.1;

// carpet texture image size: 760x1235
var carpetLength = 32.5;
var carpetHeight = 0.1;
var carpetWidth = 20;


var numNodes = 16;
var numAngles = 22;
var numCatParts = 14;    // from torso to tail3 -> the cat has 14 components

var theta = [];
for (var i=0; i<numAngles; i++)
    theta[i] = 0.0;

// Initialize angles
theta[headId] = 5;
theta[leftUpperArmId] = -10;
theta[rightUpperArmId] = -10;
theta[leftLowerArmId] = 20;
theta[rightLowerArmId] = 20;
theta[leftUpperLegId] = -7;
theta[rightUpperLegId] = -7;
theta[leftLowerLegId] = 20;
theta[rightLowerLegId] = 20;
theta[tail1Id] = 50;
theta[tail2Id] = 30;
theta[tail3Id] = -20;
theta[dxId] = 10;
theta[bodyVertScaleId] = 1;

const theta_initial = [...theta];

var numVertices = 24;

var stack = [];

var figure = [];
for (var i=0; i<numNodes; i++)
    figure[i] = createNode(null, null, null, null);


var pointsArray = [];
var normalsArray = [];
var tangentsArray = [];
var binormalsArray = [];


/************** TEXTURES **************/

var textureActiveLoc;
var bumpActiveLoc;

// ID textures:
const idTexCarpet = 0;
const idTexCatFace = 1;
const idTexTable = 2;
const idTexCarpetBump = 3;
const idTexCatBumpRect = 4;
const idTexCatBumpSquare = 5;
const idTexCatBumpLegs = 6;
const idTexCatBumpTail = 7;
const idTexTableBump = 8;


var texCoordsArray = [];

const texCoord_init = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];

var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];

var textures = [];


function configureTexture(image, textureIndex) {
    textures[textureIndex] = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textures[textureIndex]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}



/************** ANIMATION **************/

var animationOn = false;
var tailLoop = true;
var stopAfterEachKeyFrame = false;

function toggleAnimation() {
    animationOn = !animationOn;
    document.getElementById("start_animation").disabled = animationOn;
    document.getElementById("pause_animation").disabled = !animationOn;
}

var currentKeyFrame = 0;
var currentFrame = 0;

var framesBetweenKeyFrames = 10;        // used for the interpolation


var keyFrames = [];

keyFrames[0] = [...theta];       // initial position ("shallow copy")

/*
    Walk cycle schema:
    
    left arm  | right arm | body
    right leg |  left leg |
  ------------+-----------+------
1 | floor2    | raised    | up
2 | behind    | floor1    | down
3 | raised    | floor2    | up
4 | floor1    | behind    | down

*/

// Walk:
//                    left arm | right arm | left leg | right leg |   |   tail      |   body      | 
keyFrames[1] = [ 0,5,  -8,4,      40,12,      12,48,     -18,8,     0,  -4,-12,-20,  9.6, 0.11, 0,  0, 0,0,0, 1 ];
keyFrames[2] = [ 0,5, -20,-24,     4,20,      -8,24,     -24,-20,   0,  -52,-16,-4,  9.0, -0.2, 0,  0, 0,0,0, 1 ];
keyFrames[3] = [ 0,5,  40,12,     -8,4,       -18,8,      12,48,    0,  -48,-4,8,    8.4, 0.11, 0,  0, 0,0,0, 1 ];
keyFrames[4] = [ 0,5,  4,20,     -20,-24,    -24,-20,     -8,24,    0,  -54,-8,-4,   7.8, -0.2, 0,  0, 0,0,0, 1 ];

keyFrames[5] = [...keyFrames[1]];
keyFrames[5][dxId] = keyFrames[4][dxId] - 0.6;
keyFrames[5][tail1Id] = -64;
keyFrames[5][tail2Id] = -12;
keyFrames[5][tail3Id] = -20;

keyFrames[6] = [...keyFrames[2]];
keyFrames[6][dxId] = keyFrames[5][dxId] - 0.6;

keyFrames[7] = [...keyFrames[3]];
keyFrames[7][dxId] = keyFrames[6][dxId] - 0.6;

keyFrames[8] = [...keyFrames[4]];
keyFrames[8][dxId] = keyFrames[7][dxId] - 0.6;

keyFrames[9] = [...keyFrames[5]];
keyFrames[9][dxId] = keyFrames[8][dxId] - 0.6;

keyFrames[10] = [...keyFrames[2]];
keyFrames[10][dxId] = keyFrames[9][dxId] - 0.6;

keyFrames[11] = [...keyFrames[3]];
keyFrames[11][dxId] = keyFrames[10][dxId] - 0.6;

keyFrames[12] = [...keyFrames[4]];
keyFrames[12][dxId] = keyFrames[11][dxId] - 0.6;

keyFrames[13] = [...keyFrames[5]];
keyFrames[13][dxId] = keyFrames[12][dxId] - 0.6;

// Jump:
keyFrames[14] = [ 0,20,-16,8,-16,8,4,64,4,64,16,40,-12,-20,2,-0.35,0,0.19,0,0,0,1 ];
keyFrames[15] = [ 0,20,-56,88,-56,88,-20,76,-20,76,16,44,-16,-32,2,-0.77,0,0.57,0,0,0,0.95 ];     // squash
keyFrames[16] = [ 0,-12,96,4,96,4,-36,16,-36,16,48,12,16,-8,1.1,4.83,0,0,0,0,0,1.3 ];           // stretch
keyFrames[17] = [ 0,-12,44,12,44,12,-32,28,-32,28,8,-32,0,16,-0.7,7.91,0,0,0,0,0,1.15 ];        // stretch
keyFrames[18] = [ 0,-28,12,88,12,88,32,40,32,40,-40,-8,-4,-16, -3.2, 7.36,0,0,0,0,0,0.95 ];        // squash
keyFrames[19] = [ 0,-12,-44,96,-44,96,-8,64,-8,64,4,40,-12,-12,-3.7,5.93,0,0.31,0,0,0,0.85 ];       // squash
keyFrames[20] = [ 0,5,-10,20,-10,20,-7,20,-7,20,0,44,16,12,-4.5,6.79,0,0,0,0,0,1 ];

// Walk on table:
keyFrames[21] = [ 0,5,  -8,4,    40,12,    12,48,   -18,8,    0,  -4,-12,-20,  -4.9, 6.94, 0,  0, 0,0,0, 1 ];
keyFrames[22] = [ 0,5, -20,-24,  4,20,     -8,24,   -24,-20,  0,  -52,-16,-4,  -5.5, 6.66, 0,  0, 0,0,0, 1 ];
keyFrames[23] = [ 0,5,  40,12,   -8,4,     -18,8,    12,48,   0,  -48,-4,8,    -6.1, 6.94, 0,  0, 0,0,0, 1 ];
keyFrames[24] = [ 0,5,  4,20,   -20,-24,   -24,-20,  -8,24,   0,  -54,-8,-4,   -6.7, 6.66, 0,  0, 0,0,0, 1];

keyFrames[25] = [...keyFrames[21]];
keyFrames[25][dxId] = keyFrames[24][dxId] - 0.6;
keyFrames[25][tail1Id] = -64;
keyFrames[25][tail2Id] = -12;
keyFrames[25][tail3Id] = -20;

keyFrames[26] = [...keyFrames[22]];
keyFrames[26][dxId] = keyFrames[25][dxId] - 0.6;

// Sit on table:
keyFrames[27] = [ 0,5,0,36,4,12,-4,32,-4,32,0,24,-12,-20,-8.1,6.66,0,0,0,0,0,1 ];
keyFrames[28] = [ 0,-5.5,-34,76,-28,56,-8,52,-8,52,16,35,7,-24,-7.76,6.415,0,0.3,0,0,0,1 ];
keyFrames[29] = [ 0,-16,-40,16,-40,16,-12,72,-12,72,28,20,-16,-28,-7.42,6.17,0,0.6,0,0,0,1 ];
const startTailLoop = 29;

// Move tail (loop):
keyFrames[30] = [ 0,-16,-40,16,-40,16,-12,72,-12,72,28,20,-16,-20,-7.42,6.17,0,0.6,-20,4,8,1 ];
keyFrames[31] = [ 0,-16,-40,16,-40,16,-12,72,-12,72,28,20,-16,-20,-7.42,6.17,0,0.6,-20,-12,-8,1 ];
keyFrames[32] = [ 0,-16,-40,16,-40,16,-12,72,-12,72,28,20,-16,-28,-7.42,6.17,0,0.6,0,0,0,1 ];
keyFrames[33] = [ 0,-16,-40,16,-40,16,-12,72,-12,72,28,20,-16,-20,-7.42,6.17,0,0.6,24,-8,-12,1 ];
keyFrames[34] = [ 0,-16,-40,16,-40,16,-12,72,-12,72,28,20,-16,-20,-7.42,6.17,0,0.6,20,8,12,1 ];
keyFrames[35] = [ 0,-16,-40,16,-40,16,-12,72,-12,72,28,20,-16,-28,-7.42,6.17,0,0.6,0,0,0,1 ];

var numKeyFrames = keyFrames.length;



/************** MOTION BLUR **************/

var framebuffer;
var texture2, texture3, texture4, texture5;
var renderbuffer2, renderbuffer3, renderbuffer4;
var depth;
var texWidth, texHeight;

var prevPrevFrame = [...theta];
var prevFrame = [...theta];

var motionBlur = false;




init();



function createNode(transform, render, sibling, child) {
    var node = {
        transform: transform,       // matrice di trasformazione
        render: render,             // funzione che disegna il nodo (chiama la DRAW dello shader)
        sibling: sibling,           // id di un altro nodo
        child: child,               // id di un altro nodo
    }
    return node;
}


function initNodes(Id) {

    var m = mat4();

    switch(Id) {

    case torsoId:
    case torso2Id:
        m = mult(m,translate(theta[dxId], theta[dyId], theta[dzId]));
        m = mult(m,scale(1.0, theta[bodyVertScaleId], 1.0));
        m = mult(m, rotate(theta[torsoId], vec3(0, 1, 0)));
        m = mult(m, rotate(theta[torso2Id], vec3(0, 0, 1)));
        figure[torsoId] = createNode(m, torso, null, headId);
        break;

    case headId:
        var rotation_point = [-0.5*torsoLength + 0.2*headLength, torsoHeight, 0.0];
        m = translate(rotation_point[0], rotation_point[1], rotation_point[2]);
        m = mult(m, rotate(theta[headId], vec3(0, 0, 1)));         // rotate around the head's attachment point
        m = mult(m, translate(-rotation_point[0], -rotation_point[1], -rotation_point[2]));
        figure[headId] = createNode(m, head, leftUpperArmId, null);
        break;

    case leftUpperArmId:
        m = translate(0.08, 0, 0);

        var rotation_point = [-0.5*torsoLength + 0.5*upperArmLength, 0.0, 0.0];
        m = mult(m, translate(rotation_point[0], rotation_point[1], rotation_point[2]));
        m = mult(m, rotate(theta[leftUpperArmId], vec3(0, 0, 1)));
        m = mult(m, translate(-rotation_point[0], -rotation_point[1], -rotation_point[2]));

        figure[leftUpperArmId] = createNode(m, leftUpperArm, rightUpperArmId, leftLowerArmId);
        break;

    case rightUpperArmId:
        m = translate(0.08, 0, 0);

        var rotation_point = [-0.5*torsoLength + 0.5*upperArmLength, 0.0, 0.0];
        m = mult(m, translate(rotation_point[0], rotation_point[1], rotation_point[2]));
        m = mult(m, rotate(theta[rightUpperArmId], vec3(0, 0, 1)));
        m = mult(m, translate(-rotation_point[0], -rotation_point[1], -rotation_point[2]));

        figure[rightUpperArmId] = createNode(m, rightUpperArm, leftUpperLegId, rightLowerArmId);
        break;

    case leftUpperLegId:
        m = translate(0.0, theta[legsTranslationId], 0.0);
        var rotation_point = [0.5*torsoLength - 0.5*upperLegLength, -0.05, 0.0];
        m = mult(m, translate(rotation_point[0], rotation_point[1], rotation_point[2]));
        m = mult(m, rotate(theta[leftUpperLegId], vec3(0, 0, 1)));
        m = mult(m, translate(-rotation_point[0], -rotation_point[1], -rotation_point[2]));

        figure[leftUpperLegId] = createNode(m, leftUpperLeg, rightUpperLegId, leftLowerLegId);
        break;

    case rightUpperLegId:
        m = translate(0.0, theta[legsTranslationId], 0.0);
        var rotation_point = [0.5*torsoLength - 0.5*upperLegLength, 0.0, 0.0];
        m = mult(m, translate(rotation_point[0], rotation_point[1], rotation_point[2]));
        m = mult(m, rotate(theta[rightUpperLegId], vec3(0, 0, 1)));
        m = mult(m, translate(-rotation_point[0], -rotation_point[1], -rotation_point[2]));

        figure[rightUpperLegId] = createNode(m, rightUpperLeg, tail1Id, rightLowerLegId);
        break;

    case tail1Id:
        var rotation_point = [0.5*torsoLength - overlap, torsoHeight - 0.5*tailWidth, 0.0];
        m = translate(rotation_point[0], rotation_point[1], rotation_point[2]);
        m = mult(m, rotate(theta[tail1RotYId], vec3(0, 1, 0)));
        m = mult(m, rotate(theta[tail1Id], vec3(0, 0, 1)));
        m = mult(m, translate(-rotation_point[0], -rotation_point[1], -rotation_point[2]));

        figure[tail1Id] = createNode(m, tail1, null, tail2Id);
        break;

    case tail2Id:
        var rotation_point = [0.5*torsoLength + tailLength - 2*overlap, torsoHeight - 0.5*tailWidth, 0.0];
        m = translate(rotation_point[0], rotation_point[1], rotation_point[2]);
        m = mult(m, rotate(theta[tail2RotYId], vec3(0, 1, 0)));
        m = mult(m, rotate(theta[tail2Id], vec3(0, 0, 1)));
        m = mult(m, translate(-rotation_point[0], -rotation_point[1], -rotation_point[2]));

        figure[tail2Id] = createNode(m, tail2, null, tail3Id);
        break;

    case tail3Id:
        var rotation_point = [0.5*torsoLength + 2*tailLength - 3*overlap, torsoHeight - 0.5*tailWidth, 0.0];
        m = translate(rotation_point[0], rotation_point[1], rotation_point[2]);
        m = mult(m, rotate(theta[tail3RotYId], vec3(0, 1, 0)));
        m = mult(m, rotate(theta[tail3Id], vec3(0, 0, 1)));
        m = mult(m, translate(-rotation_point[0], -rotation_point[1], -rotation_point[2]));

        figure[tail3Id] = createNode(m, tail3, null, null);
        break;

    case leftLowerArmId:
        var rotation_point = [-0.5*torsoLength + 0.5*upperArmLength, -upperArmHeight + 0.5*lowerArmWidth, 0.0];
        m = translate(rotation_point[0], rotation_point[1], rotation_point[2]);
        m = mult(m, rotate(theta[leftLowerArmId], vec3(0, 0, 1)));
        m = mult(m, translate(-rotation_point[0], -rotation_point[1], -rotation_point[2]));

        figure[leftLowerArmId] = createNode(m, leftLowerArm, null, null);
        break;

    case rightLowerArmId:
        var rotation_point = [-0.5*torsoLength + 0.5*upperArmLength, -upperArmHeight + 0.5*lowerArmWidth, 0.0];
        m = translate(rotation_point[0], rotation_point[1], rotation_point[2]);
        m = mult(m, rotate(theta[rightLowerArmId], vec3(0, 0, 1)));
        m = mult(m, translate(-rotation_point[0], -rotation_point[1], -rotation_point[2]));

        figure[rightLowerArmId] = createNode(m, rightLowerArm, null, null);
        break;

    case leftLowerLegId:
        var rotation_point = [0.5*torsoLength - 0.5*lowerLegLength, -upperLegHeight + 0.5*lowerLegWidth, 0.0];
        m = mult(m, translate(rotation_point[0], rotation_point[1], rotation_point[2]));
        m = mult(m, rotate(theta[leftLowerLegId], vec3(0, 0, 1)));
        m = mult(m, translate(-rotation_point[0], -rotation_point[1], -rotation_point[2]));

        figure[leftLowerLegId] = createNode(m, leftLowerLeg, null, null);
        break;

    case rightLowerLegId:
        var rotation_point = [0.5*torsoLength - 0.5*lowerLegLength, -upperLegHeight + 0.5*lowerLegWidth, 0.0];
        m = mult(m, translate(rotation_point[0], rotation_point[1], rotation_point[2]));
        m = mult(m, rotate(theta[rightLowerLegId], vec3(0, 0, 1)));
        m = mult(m, translate(-rotation_point[0], -rotation_point[1], -rotation_point[2]));

        figure[rightLowerLegId] = createNode(m, rightLowerLeg, null, null);
        break;

    case carpetId:
        figure[carpetId] = createNode(m, carpet, tableId, null);
        break;
    
    case tableId:
        figure[tableId] = createNode(m, table, null, null);
        break;
    }

}

function traverse(Id) {
    if (Id == null) return;      // serve perche' e' ricorsiva
    stack.push(modelViewMatrix);                                    // salvati la modelview corrente
    modelViewMatrix = mult(modelViewMatrix, figure[Id].transform);      // modifica la modelview
    figure[Id].render();                                            // fai il render con la modelview modificata
    if (figure[Id].child != null) traverse(figure[Id].child);    // disegna i figli con la modelview modificata
    modelViewMatrix = stack.pop();                                  // ripristina la modelview che avevi prima
    if (figure[Id].sibling != null) traverse(figure[Id].sibling);   // disegna i fratelli
}

function torso() {
    gl.useProgram(program1);

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5*torsoHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale(torsoLength, torsoHeight, torsoWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));

    // Send colors:
    gl.uniform4fv(materialAmbientLoc, materialAmbientCat);
    gl.uniform4fv(materialDiffuseLoc, materialDiffuseCat);
    gl.uniform4fv(materialSpecularLoc, materialSpecularCat);
    gl.uniform1f(materialShininessLoc, materialShininessCat);

    gl.uniform1i(textureActiveLoc, false);
    gl.uniform1i(bumpActiveLoc, true);

    gl.activeTexture(gl.TEXTURE1);
    gl.uniform1i(gl.getUniformLocation(program1, "uBump"), 1);

    for(var i=0; i<6; i++) {
        if (i == 4 || i == 0 || i == 3 || i == 2)                           // rectangular sides
            gl.bindTexture(gl.TEXTURE_2D, textures[idTexCatBumpRect]);
        else                                                                // square sides
            gl.bindTexture(gl.TEXTURE_2D, textures[idTexCatBumpSquare]);
       
        gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
    }
}

function head() {
    gl.useProgram(program1);

    instanceMatrix = mult(modelViewMatrix, translate(-0.5*torsoLength, torsoHeight + 0.3*headHeight, 0.0 ));
    instanceMatrix = mult(instanceMatrix, scale(headLength, headHeight, headWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    
    // Send colors:
    gl.uniform4fv(materialAmbientLoc, materialAmbientCat);
    gl.uniform4fv(materialDiffuseLoc, materialDiffuseCat);
    gl.uniform4fv(materialSpecularLoc, materialSpecularCat);
    gl.uniform1f(materialShininessLoc, materialShininessCat);

    gl.uniform1i(bumpActiveLoc, true);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, textures[idTexCatBumpSquare]);
    gl.uniform1i(gl.getUniformLocation(program1, "uBump"), 1);

    for(var i=0; i<6; i++) {
        if (i == 5) {       // face
            gl.uniform1i(textureActiveLoc, true);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, textures[idTexCatFace]);
            gl.uniform1i(gl.getUniformLocation(program1, "uTexture"), 0);
        }
        
        else {
            gl.uniform1i(textureActiveLoc, false);
        }
        gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
    }
}

function leftUpperArm() {
    gl.useProgram(program1);

    instanceMatrix = mult(modelViewMatrix, translate(-0.5*torsoLength + 0.5*upperArmLength, -0.5*upperArmHeight + overlap, 0.5*torsoWidth - 0.5*upperArmWidth + 0.01));
    instanceMatrix = mult(instanceMatrix, scale(upperArmLength, upperArmHeight, upperArmWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    
    // Send colors:
    gl.uniform4fv(materialAmbientLoc, materialAmbientCat);
    gl.uniform4fv(materialDiffuseLoc, materialDiffuseCat);
    gl.uniform4fv(materialSpecularLoc, materialSpecularCat);
    gl.uniform1f(materialShininessLoc, materialShininessCat);

    gl.uniform1i(textureActiveLoc, false);
    gl.uniform1i(bumpActiveLoc, true);

    gl.activeTexture(gl.TEXTURE1);
    gl.uniform1i(gl.getUniformLocation(program1, "uBump"), 1);

    for(var i=0; i<6; i++) {
        if (i == 5)
            gl.bindTexture(gl.TEXTURE_2D, textures[idTexCatBumpTail]);
        else
            gl.bindTexture(gl.TEXTURE_2D, textures[idTexCatBumpLegs]);
        gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
    }
}

function leftLowerArm() {
    gl.useProgram(program1);

    instanceMatrix = mult(modelViewMatrix, translate(-0.5*torsoLength + 0.5*lowerArmLength, -0.5*lowerArmHeight - upperArmHeight + 2*overlap, 0.5*torsoWidth - 0.5*lowerArmWidth + 0.01));
    instanceMatrix = mult(instanceMatrix, scale(lowerArmLength, lowerArmHeight, lowerArmWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    
    // Send colors:
    gl.uniform4fv(materialAmbientLoc, materialAmbientCat);
    gl.uniform4fv(materialDiffuseLoc, materialDiffuseCat);
    gl.uniform4fv(materialSpecularLoc, materialSpecularCat);
    gl.uniform1f(materialShininessLoc, materialShininessCat);

    gl.uniform1i(textureActiveLoc, false);
    gl.uniform1i(bumpActiveLoc, true);

    gl.activeTexture(gl.TEXTURE1);
    gl.uniform1i(gl.getUniformLocation(program1, "uBump"), 1);

    for(var i=0; i<6; i++) {
        if (i == 5)
            gl.bindTexture(gl.TEXTURE_2D, textures[idTexCatBumpTail]);
        else
            gl.bindTexture(gl.TEXTURE_2D, textures[idTexCatBumpLegs]);
        gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
    }
}

function rightUpperArm() {
    gl.useProgram(program1);

    instanceMatrix = mult(modelViewMatrix, translate(-0.5*torsoLength + 0.5*upperArmLength, -0.5*upperArmHeight + overlap, -0.5*torsoWidth + 0.5*upperArmWidth - 0.01));
    instanceMatrix = mult(instanceMatrix, scale(upperArmLength, upperArmHeight, upperArmWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    
    // Send colors:
    gl.uniform4fv(materialAmbientLoc, materialAmbientCat);
    gl.uniform4fv(materialDiffuseLoc, materialDiffuseCat);
    gl.uniform4fv(materialSpecularLoc, materialSpecularCat);
    gl.uniform1f(materialShininessLoc, materialShininessCat);

    gl.uniform1i(textureActiveLoc, false);
    gl.uniform1i(bumpActiveLoc, true);

    gl.activeTexture(gl.TEXTURE1);
    gl.uniform1i(gl.getUniformLocation(program1, "uBump"), 1);

    for(var i=0; i<6; i++) {
        if (i == 5)
            gl.bindTexture(gl.TEXTURE_2D, textures[idTexCatBumpTail]);
        else
            gl.bindTexture(gl.TEXTURE_2D, textures[idTexCatBumpLegs]);
        gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
    }
}

function rightLowerArm() {
    gl.useProgram(program1);

    instanceMatrix = mult(modelViewMatrix, translate(-0.5*torsoLength + 0.5*lowerArmLength, -0.5*lowerArmHeight - upperArmHeight + 2*overlap, -0.5*torsoWidth + 0.5*lowerArmWidth - 0.01));
    instanceMatrix = mult(instanceMatrix, scale(lowerArmLength, lowerArmHeight, lowerArmWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    
    // Send colors:
    gl.uniform4fv(materialAmbientLoc, materialAmbientCat);
    gl.uniform4fv(materialDiffuseLoc, materialDiffuseCat);
    gl.uniform4fv(materialSpecularLoc, materialSpecularCat);
    gl.uniform1f(materialShininessLoc, materialShininessCat);

    gl.uniform1i(textureActiveLoc, false);
    gl.uniform1i(bumpActiveLoc, true);

    gl.activeTexture(gl.TEXTURE1);
    gl.uniform1i(gl.getUniformLocation(program1, "uBump"), 1);

    for(var i=0; i<6; i++) {
        if (i == 5)
            gl.bindTexture(gl.TEXTURE_2D, textures[idTexCatBumpTail]);
        else
            gl.bindTexture(gl.TEXTURE_2D, textures[idTexCatBumpLegs]);
        gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
    }
}

function leftUpperLeg() {
    gl.useProgram(program1);

    instanceMatrix = mult(modelViewMatrix, translate(0.5*torsoLength - 0.5*upperLegLength, -0.5*upperLegHeight + 0.3 + overlap, 0.5*torsoWidth - 0.5*upperLegWidth + 0.01));
    instanceMatrix = mult(instanceMatrix, scale(upperLegLength, upperLegHeight, upperLegWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    
    // Send colors:
    gl.uniform4fv(materialAmbientLoc, materialAmbientCat);
    gl.uniform4fv(materialDiffuseLoc, materialDiffuseCat);
    gl.uniform4fv(materialSpecularLoc, materialSpecularCat);
    gl.uniform1f(materialShininessLoc, materialShininessCat);

    gl.uniform1i(textureActiveLoc, false);
    gl.uniform1i(bumpActiveLoc, true);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, textures[idTexCatBumpSquare]);
    gl.uniform1i(gl.getUniformLocation(program1, "uBump"), 1);

    for(var i=0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function leftLowerLeg() {
    gl.useProgram(program1);

    instanceMatrix = mult(modelViewMatrix, translate(0.5*torsoLength - 0.5*lowerLegLength, -0.5*lowerLegHeight - upperLegHeight + 0.3 + 3*overlap, 0.5*torsoWidth - 0.5*lowerLegWidth + 0.01));
    instanceMatrix = mult(instanceMatrix, scale(lowerLegLength, lowerLegHeight, lowerLegWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    
    // Send colors:
    gl.uniform4fv(materialAmbientLoc, materialAmbientCat);
    gl.uniform4fv(materialDiffuseLoc, materialDiffuseCat);
    gl.uniform4fv(materialSpecularLoc, materialSpecularCat);
    gl.uniform1f(materialShininessLoc, materialShininessCat);

    gl.uniform1i(textureActiveLoc, false);
    gl.uniform1i(bumpActiveLoc, true);

    gl.activeTexture(gl.TEXTURE1);
    gl.uniform1i(gl.getUniformLocation(program1, "uBump"), 1);

    for(var i=0; i<6; i++) {
        if (i == 5)
            gl.bindTexture(gl.TEXTURE_2D, textures[idTexCatBumpTail]);
        else
            gl.bindTexture(gl.TEXTURE_2D, textures[idTexCatBumpLegs]);
        gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
    }
}

function rightUpperLeg() {
    gl.useProgram(program1);

    instanceMatrix = mult(modelViewMatrix, translate(0.5*torsoLength - 0.5*upperLegLength, -0.5*upperLegHeight + 0.3 + overlap, -0.5*torsoWidth + 0.5*upperLegWidth - 0.01));
    instanceMatrix = mult(instanceMatrix, scale(upperLegLength, upperLegHeight, upperLegWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    
    // Send colors:
    gl.uniform4fv(materialAmbientLoc, materialAmbientCat);
    gl.uniform4fv(materialDiffuseLoc, materialDiffuseCat);
    gl.uniform4fv(materialSpecularLoc, materialSpecularCat);
    gl.uniform1f(materialShininessLoc, materialShininessCat);

    gl.uniform1i(textureActiveLoc, false);
    gl.uniform1i(bumpActiveLoc, true);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, textures[idTexCatBumpSquare]);
    gl.uniform1i(gl.getUniformLocation(program1, "uBump"), 1);

    for(var i=0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function rightLowerLeg() {
    gl.useProgram(program1);

    instanceMatrix = mult(modelViewMatrix, translate(0.5*torsoLength - 0.5*lowerLegLength, -0.5*lowerLegHeight - upperLegHeight + 0.3 + 3*overlap, -0.5*torsoWidth + 0.5*lowerLegWidth - 0.01));
    instanceMatrix = mult(instanceMatrix, scale(lowerLegLength, lowerLegHeight, lowerLegWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    
    // Send colors:
    gl.uniform4fv(materialAmbientLoc, materialAmbientCat);
    gl.uniform4fv(materialDiffuseLoc, materialDiffuseCat);
    gl.uniform4fv(materialSpecularLoc, materialSpecularCat);
    gl.uniform1f(materialShininessLoc, materialShininessCat);

    gl.uniform1i(textureActiveLoc, false);
    gl.uniform1i(bumpActiveLoc, true);

    gl.activeTexture(gl.TEXTURE1);
    gl.uniform1i(gl.getUniformLocation(program1, "uBump"), 1);

    for(var i=0; i<6; i++) {
        if (i == 5)
            gl.bindTexture(gl.TEXTURE_2D, textures[idTexCatBumpTail]);
        else
            gl.bindTexture(gl.TEXTURE_2D, textures[idTexCatBumpLegs]);
        gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
    }
}

function tail1() {
    gl.useProgram(program1);

    instanceMatrix = mult(modelViewMatrix, translate(0.5*torsoLength + 0.5*tailLength - overlap, torsoHeight - 0.5*tailWidth, 0.0));
    instanceMatrix = mult(instanceMatrix, scale(tailLength, tailWidth, tailWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    
    // Send colors:
    gl.uniform4fv(materialAmbientLoc, materialAmbientCat);
    gl.uniform4fv(materialDiffuseLoc, materialDiffuseCat);
    gl.uniform4fv(materialSpecularLoc, materialSpecularCat);
    gl.uniform1f(materialShininessLoc, materialShininessCat);

    gl.uniform1i(textureActiveLoc, false);
    gl.uniform1i(bumpActiveLoc, true);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, textures[idTexCatBumpTail]);
    gl.uniform1i(gl.getUniformLocation(program1, "uBump"), 1);

    for(var i=0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);

    texCoord = texCoord_init;
}
function tail2() {
    gl.useProgram(program1);

    instanceMatrix = mult(modelViewMatrix, translate(0.5*torsoLength + 1.5*tailLength - 2*overlap, torsoHeight - 0.5*tailWidth, 0.0));
    instanceMatrix = mult(instanceMatrix, scale(tailLength, tailWidth, tailWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    
    // Send colors:
    gl.uniform4fv(materialAmbientLoc, materialAmbientCat);
    gl.uniform4fv(materialDiffuseLoc, materialDiffuseCat);
    gl.uniform4fv(materialSpecularLoc, materialSpecularCat);
    gl.uniform1f(materialShininessLoc, materialShininessCat);

    gl.uniform1i(textureActiveLoc, false);
    gl.uniform1i(bumpActiveLoc, true);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, textures[idTexCatBumpTail]);
    gl.uniform1i(gl.getUniformLocation(program1, "uBump"), 1);
    
    for(var i=0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}
function tail3() {
    gl.useProgram(program1);

    instanceMatrix = mult(modelViewMatrix, translate(0.5*torsoLength + 2.5*tailLength - 3*overlap, torsoHeight - 0.5*tailWidth, 0.0));
    instanceMatrix = mult(instanceMatrix, scale(tailLength, tailWidth, tailWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    
    // Send colors:
    gl.uniform4fv(materialAmbientLoc, materialAmbientCat);
    gl.uniform4fv(materialDiffuseLoc, materialDiffuseCat);
    gl.uniform4fv(materialSpecularLoc, materialSpecularCat);
    gl.uniform1f(materialShininessLoc, materialShininessCat);

    gl.uniform1i(textureActiveLoc, false);
    gl.uniform1i(bumpActiveLoc, true);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, textures[idTexCatBumpTail]);
    gl.uniform1i(gl.getUniformLocation(program1, "uBump"), 1);

    for(var i=0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function carpet() {
    gl.useProgram(program1);

    instanceMatrix = mult(modelViewMatrix, translate(-1, -upperLegHeight - lowerLegHeight + 0.5*carpetHeight + 0.3 + 2*overlap, 0.0));
    instanceMatrix = mult(instanceMatrix, scale(carpetLength, carpetHeight, carpetWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    
    // Send colors:
    gl.uniform4fv(materialAmbientLoc, materialAmbientCarpet);
    gl.uniform4fv(materialDiffuseLoc, materialDiffuseCarpet);
    gl.uniform4fv(materialSpecularLoc, materialSpecularCarpet);
    gl.uniform1f(materialShininessLoc, materialShininessCarpet);

    gl.uniform1i(textureActiveLoc, false);
    gl.uniform1i(bumpActiveLoc, false);

    for(var i=0; i<6; i++) {
        if (i == 3) {
            gl.uniform1i(textureActiveLoc, true);
            gl.uniform1i(bumpActiveLoc, true);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, textures[idTexCarpet]);
            gl.uniform1i(gl.getUniformLocation(program1, "uTexture"), 0);
            
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, textures[idTexCarpetBump]);
            gl.uniform1i(gl.getUniformLocation(program1, "uBump"), 1);
            
            gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4); 
            
            gl.uniform1i(textureActiveLoc, false);
            gl.uniform1i(bumpActiveLoc, false);
        }
        else
            gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4); 
    }
}

function table() {
    gl.useProgram(program1);

    // Send colors:
    gl.uniform4fv(materialAmbientLoc, materialAmbientTable);
    gl.uniform4fv(materialDiffuseLoc, materialDiffuseTable);
    gl.uniform4fv(materialSpecularLoc, materialSpecularTable);
    gl.uniform1f(materialShininessLoc, materialShininessTable);
    
    gl.uniform1i(textureActiveLoc, false);
    gl.uniform1i(bumpActiveLoc, false);


    var dx = -15.5;
    var dy = - 0.5*torsoHeight - 0.5*upperLegHeight - 0.5*lowerLegHeight + 0.5*carpetHeight;
    var leg_offset = 0.5;

    // Table top
    instanceMatrix = mult(modelViewMatrix, translate(dx + 0.5*tableTopLength, tableLegHeight + 0.5*tableTopHeight + dy + carpetHeight, 0.0));
    instanceMatrix = mult(instanceMatrix, scale(tableTopLength, tableTopHeight, tableTopWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));

    for(var i=0; i<6; i++) {
        if (i == 3) {
            gl.uniform1i(textureActiveLoc, true);
            gl.uniform1i(bumpActiveLoc, true);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, textures[idTexTable]);
            gl.uniform1i(gl.getUniformLocation(program1, "uTexture"), 0);

            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, textures[idTexTableBump]);
            gl.uniform1i(gl.getUniformLocation(program1, "uBump"), 1);

            gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4); 
            
            gl.uniform1i(textureActiveLoc, false);
            gl.uniform1i(bumpActiveLoc, false);
        }
        else
            gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4); 
    }

    // Leg 1 (bottom left)
    instanceMatrix = mult(modelViewMatrix, translate(dx + 0.5*tableLegWidth + leg_offset, 0.5*tableLegHeight + dy + carpetHeight, 0.5*tableTopWidth - 0.5*tableLegWidth - leg_offset));
    instanceMatrix = mult(instanceMatrix, scale(tableLegWidth, tableLegHeight, tableLegWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i=0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);

    // Leg 2 (bottom right)
    instanceMatrix = mult(modelViewMatrix, translate(dx + tableTopLength - 0.5*tableLegWidth - leg_offset, 0.5*tableLegHeight + dy  + carpetHeight, 0.5*tableTopWidth - 0.5*tableLegWidth - leg_offset));
    instanceMatrix = mult(instanceMatrix, scale(tableLegWidth, tableLegHeight, tableLegWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i=0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);

    // Leg 3 (top right)
    instanceMatrix = mult(modelViewMatrix, translate(dx + tableTopLength - 0.5*tableLegWidth - leg_offset, 0.5*tableLegHeight + dy  + carpetHeight, -0.5*tableTopWidth + 0.5*tableLegWidth + leg_offset));
    instanceMatrix = mult(instanceMatrix, scale(tableLegWidth, tableLegHeight, tableLegWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i=0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
    
    // Leg 4 (top left)
    instanceMatrix = mult(modelViewMatrix, translate(dx + 0.5*tableLegWidth + leg_offset, 0.5*tableLegHeight + dy + carpetHeight, -0.5*tableTopWidth + 0.5*tableLegWidth + leg_offset));
    instanceMatrix = mult(instanceMatrix, scale(tableLegWidth, tableLegHeight, tableLegWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i=0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function quad(a, b, c, d) {
    var t1 = subtract(vertices[b], vertices[a]);    // ab
    var t2 = subtract(vertices[c], vertices[b]);    // bc

    var normal = vec3(cross(t1, t2));
    var tangent = vec3(t1[0], t1[1], t1[2]);        // ab
    var binormal = vec3(cross(normal, tangent));


    pointsArray.push(vertices[a]);
    texCoordsArray.push(texCoord[0]);
    normalsArray.push(normal);
    tangentsArray.push(tangent);
    binormalsArray.push(binormal);

    pointsArray.push(vertices[b]);
    texCoordsArray.push(texCoord[1]);
    normalsArray.push(normal);
    tangentsArray.push(tangent);
    binormalsArray.push(binormal);

    pointsArray.push(vertices[c]);
    texCoordsArray.push(texCoord[2]);
    normalsArray.push(normal);
    tangentsArray.push(tangent);
    binormalsArray.push(binormal);

    pointsArray.push(vertices[d]);
    texCoordsArray.push(texCoord[3]);
    normalsArray.push(normal);
    tangentsArray.push(tangent);
    binormalsArray.push(binormal);
}


function cube() {
    quad( 0, 3, 2, 1 );     // 0: lato sx gatto
    quad( 2, 3, 7, 6 );     // 1: dietro gatto
    quad( 4, 7, 3, 0 );     // 2: sotto
    quad( 1, 2, 6, 5 );     // 3: sopra
    quad( 5, 6, 7, 4 );     // 4: lato dx gatto
    quad( 5, 4, 0, 1 );     // 5: davanti gatto
}

function drawSquareForMotionBlur() {

    pointsArray.push(vec4(-1.0, -1.0, 0.0, 1.0));
    pointsArray.push(vec4(-1.0, 1.0, 0.0, 1.0));
    pointsArray.push(vec4(1.0, 1.0, 0.0, 1.0));
    pointsArray.push(vec4(1.0, -1.0, 0.0, 1.0));

    texCoordsArray.push(vec2(0,0));
    texCoordsArray.push(vec2(0,1));
    texCoordsArray.push(vec2(1,1));
    texCoordsArray.push(vec2(1,0));
}

function init() {

    canvas = document.getElementById("gl-canvas");
    // Full screen:
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    window.onresize = function() {                      // To handle the full screen
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        gl.viewport( 0, 0, canvas.width, canvas.height );
        
        aspect =  canvas.width/canvas.height;
        projectionMatrix = perspective(fov, aspect, near, far);


        gl.useProgram(program2);
        
        gl.uniform1f(gl.getUniformLocation(program2, "onePixelVertical"), 1/canvas.height);
        gl.uniform1f(gl.getUniformLocation(program2, "onePixelHorizontal"), 1/canvas.width);

        gl.useProgram(program1);
        gl.uniformMatrix4fv(gl.getUniformLocation(program1, "uProjectionMatrix"), false, flatten(projectionMatrix));


        texWidth = canvas.width;
        texHeight = canvas.height;

        gl.bindTexture(gl.TEXTURE_2D, texture2);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texWidth, texHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        gl.bindTexture( gl.TEXTURE_2D, texture3);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texWidth, texHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        gl.bindTexture( gl.TEXTURE_2D, texture4);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texWidth, texHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        gl.bindTexture( gl.TEXTURE_2D, texture5);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texWidth, texHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        gl.bindTexture(gl.TEXTURE_2D, null);

        framebuffer.width = texWidth;
        framebuffer.height = texHeight;

        gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer2);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, texWidth, texHeight);

        gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer3);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, texWidth, texHeight);

        gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer4);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, texWidth, texHeight);
        
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    }

    gl = canvas.getContext('webgl2');
    if (!gl) { alert("WebGL 2.0 isn't available"); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor(background_color[0], background_color[1], background_color[2], 1.0);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    aspect =  canvas.width/canvas.height;
    projectionMatrix = perspective(fov, aspect, near, far);
    modelViewMatrix = mat4();
    cameraMatrix = lookAt(eye, at, up);
    instanceMatrix = mat4();


    cube();
    drawSquareForMotionBlur();



    //  CREATE PROGRAMS

    program1 = initShaders(gl, "vertex-shader-1", "fragment-shader-1");
    program2 = initShaders(gl, "vertex-shader-2", "fragment-shader-2");


    // INITIALIZE PROGRAM 1:
    gl.useProgram(program1);

    gl.uniformMatrix4fv(gl.getUniformLocation(program1, "uModelViewMatrix"), false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(gl.getUniformLocation(program1, "uCameraMatrix"), false, flatten(cameraMatrix));
    gl.uniformMatrix4fv(gl.getUniformLocation(program1, "uProjectionMatrix"), false, flatten(projectionMatrix));

    modelViewMatrixLoc = gl.getUniformLocation(program1, "uModelViewMatrix");
    cameraMatrixLoc = gl.getUniformLocation(program1, "uCameraMatrix");

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var positionLoc = gl.getAttribLocation(program1, "aPosition");
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    var tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);

    var texCoordLoc = gl.getAttribLocation(program1, "aTexCoord");
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texCoordLoc);

    var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

    var normalLoc = gl.getAttribLocation(program1, "aNormal");
    gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(normalLoc);

    var tanBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tanBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(tangentsArray), gl.STATIC_DRAW);

    var tangentLoc = gl.getAttribLocation(program1, "aTangent");
    gl.vertexAttribPointer(tangentLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(tangentLoc);

    var binormBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, binormBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(binormalsArray), gl.STATIC_DRAW);

    var binormalLoc = gl.getAttribLocation(program1, "aBinormal");
    gl.vertexAttribPointer(binormalLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(binormalLoc);


    // INITIALIZE PROGRAM 2:
    gl.useProgram(program2);

    gl.uniform1f(gl.getUniformLocation(program2, "onePixelVertical"), 1/canvas.height);
    gl.uniform1f(gl.getUniformLocation(program2, "onePixelHorizontal"), 1/canvas.width);

    gl.uniform4fv(gl.getUniformLocation(program2, "background_color"), background_color);

    var vBuffer2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer2);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var positionLoc2 = gl.getAttribLocation(program2, "aPosition");
    gl.vertexAttribPointer(positionLoc2, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc2);

    var tbuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);

    var texCoordLoc2 = gl.getAttribLocation(program2, "aTexCoord");
    gl.vertexAttribPointer(texCoordLoc2, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray(texCoordLoc2);



    gl.useProgram(program1);

    /******* LIGHTS and COLORS *******/

    gl.uniform4fv(gl.getUniformLocation(program1, "uLightPosition"), lightPosition);

    gl.uniform4fv(gl.getUniformLocation(program1, "uAmbientLight"), lightAmbient);
    gl.uniform4fv(gl.getUniformLocation(program1, "uDiffuseLight"), lightDiffuse);
    gl.uniform4fv(gl.getUniformLocation(program1, "uSpecularLight"), lightSpecular);

    materialAmbientLoc = gl.getUniformLocation(program1, "uMaterialAmbient");
    materialDiffuseLoc = gl.getUniformLocation(program1, "uMaterialDiffuse");
    materialSpecularLoc = gl.getUniformLocation(program1, "uMaterialSpecular");
    materialShininessLoc = gl.getUniformLocation(program1, "uShininess");


    /******** TEXTURES ********/

    var imageCarpet = new Image();
    imageCarpet.src = "./textures/carpet.png";
    imageCarpet.onload = function() {
        configureTexture(imageCarpet, idTexCarpet);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textures[idTexCarpet]);
        gl.uniform1i(gl.getUniformLocation(program1, "uTexture"), 0);
    };

    var imageCatFace = new Image();
    imageCatFace.src = "./textures/cat-face.png";
    imageCatFace.onload = function() {
        configureTexture(imageCatFace, idTexCatFace);
    };

    var imageTable = new Image();
    imageTable.src = "./textures/table.png";
    imageTable.onload = function() {
        configureTexture(imageTable, idTexTable);
    };

    var imageCarpetBump = new Image();
    imageCarpetBump.src = "./textures/carpet-bump.png";
    imageCarpetBump.onload = function() {
        configureTexture(imageCarpetBump, idTexCarpetBump);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, textures[idTexCarpetBump]);
        gl.uniform1i(gl.getUniformLocation(program1, "uBump"), 1);
    };

    var imageCatBumpRect = new Image();
    imageCatBumpRect.src = "./textures/cat-bump-rect.png";
    imageCatBumpRect.onload = function() {
        configureTexture(imageCatBumpRect, idTexCatBumpRect);
    };
    var imageCatBumpSquare = new Image();
    imageCatBumpSquare.src = "./textures/cat-bump-square.png";
    imageCatBumpSquare.onload = function() {
        configureTexture(imageCatBumpSquare, idTexCatBumpSquare);
    };
    var imageCatBumpLegs = new Image();
    imageCatBumpLegs.src = "./textures/cat-bump-legs.png";
    imageCatBumpLegs.onload = function() {
        configureTexture(imageCatBumpLegs, idTexCatBumpLegs);
    };
    var imageCatBumpTail = new Image();
    imageCatBumpTail.src = "./textures/cat-bump-tail.png";
    imageCatBumpTail.onload = function() {
        configureTexture(imageCatBumpTail, idTexCatBumpTail);
    };

    var imageTableBump = new Image();
    imageTableBump.src = "./textures/table-bump.png";
    imageTableBump.onload = function() {
        configureTexture(imageTableBump, idTexTableBump);
    };

    
    textureActiveLoc = gl.getUniformLocation(program1, "uTextureActive"); 
    bumpActiveLoc = gl.getUniformLocation(program1, "uBumpActive"); 

    
    gl.useProgram(program2);

    // CREATE TEXTURES FOR MOTION BLUR
    texWidth = canvas.width;
    texHeight = canvas.height;

    texture2 = gl.createTexture();
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, texture2);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texWidth, texHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    texture3 = gl.createTexture();
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture( gl.TEXTURE_2D, texture3);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texWidth, texHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    texture4 = gl.createTexture();
    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture( gl.TEXTURE_2D, texture4);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texWidth, texHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    texture5 = gl.createTexture();
    gl.activeTexture(gl.TEXTURE5);
    gl.bindTexture( gl.TEXTURE_2D, texture5);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texWidth, texHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);


    // CREATE FRAMEBUFFER FOR MOTION BLUR
    framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer( gl.FRAMEBUFFER, framebuffer);
    framebuffer.width = texWidth;
    framebuffer.height = texHeight;

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture2, 0);

    var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status != gl.FRAMEBUFFER_COMPLETE) alert("Framebuffer Not Complete");


    // RENDERBUFFERS for the depth attachment
    renderbuffer2 = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer2);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, texWidth, texHeight);

    renderbuffer3 = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer3);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, texWidth, texHeight);

    renderbuffer4 = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer4);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, texWidth, texHeight);

    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer2);


    gl.uniform1i( gl.getUniformLocation(program2, "uTexture2"), 2);
    gl.uniform1i( gl.getUniformLocation(program2, "uTexture3"), 3);
    gl.uniform1i( gl.getUniformLocation(program2, "uTexture4"), 4);
    gl.uniform1i( gl.getUniformLocation(program2, "uTexture5"), 5);


    
    gl.useProgram(program1);


    /**** EVENT LISTENERS ****/

    /* Animation buttons: */
    document.getElementById("start_animation").onclick = function() {
        toggleAnimation();
    };
    document.getElementById("pause_animation").onclick = function() {
        toggleAnimation();
    };
    document.getElementById("reset_animation").onclick = function() {
        currentFrame = 0;
        currentKeyFrame = 0;
        animationOn = false;
        
        theta = [...theta_initial];
        prevFrame = [...theta];
        prevPrevFrame = [...theta];

        for (var i = 0; i < numCatParts; i++)
            initNodes(i);

        document.getElementById("start_animation").disabled = false;
        document.getElementById("pause_animation").disabled = true;
    };

    /* Bottom-left corner buttons */
    document.getElementById("animation_speed").onchange = function(event) {
        framesBetweenKeyFrames = 28 - parseInt(event.target.value);
    };
    document.getElementById("stop_after_each_keyframe").onchange = function() {
        stopAfterEachKeyFrame = !stopAfterEachKeyFrame;
    };
    document.getElementById("toggle_motion_blur").onclick = function() {
        motionBlur = !motionBlur;
        prevFrame = [...theta];
        prevPrevFrame = [...theta];

        if (motionBlur)
            document.getElementById("motion_blur_text").innerHTML = "Deactivate";
        else
            document.getElementById("motion_blur_text").innerHTML = "Activate";
    };

    /* Camera buttons: */
    document.getElementById("camera_left").onclick = function() {
        eye_theta -= 5;
        eye_theta %= 360;
        eye[0] = Math.sin(eye_theta*(Math.PI/180)) * viewer_distance + at[0];
        eye[2] = Math.cos(eye_theta*(Math.PI/180)) * viewer_distance + at[2];
        cameraMatrix = lookAt(eye, at, up);

        gl.useProgram(program1);
        gl.uniformMatrix4fv(cameraMatrixLoc, false, flatten(cameraMatrix));       
    };
    document.getElementById("camera_up").onclick = function() {
        eye[1] += 0.5;
        cameraMatrix = lookAt(eye, at, up);

        gl.useProgram(program1);
        gl.uniformMatrix4fv(cameraMatrixLoc, false, flatten(cameraMatrix));
    };
    document.getElementById("camera_down").onclick = function() {
        eye[1] -= 0.5;
        cameraMatrix = lookAt(eye, at, up);

        gl.useProgram(program1);
        gl.uniformMatrix4fv(cameraMatrixLoc, false, flatten(cameraMatrix));
    };
    document.getElementById("camera_right").onclick = function() {
        eye_theta += 5;
        eye_theta %= 360;
        eye[0] = Math.sin(eye_theta*(Math.PI/180)) * viewer_distance + at[0];
        eye[2] = Math.cos(eye_theta*(Math.PI/180)) * viewer_distance + at[2];
        cameraMatrix = lookAt(eye, at, up);

        gl.useProgram(program1);
        gl.uniformMatrix4fv(cameraMatrixLoc, false, flatten(cameraMatrix));       
    };
    document.getElementById("camera_closer").onclick = function() {
        viewer_distance -= 1;
        if (viewer_distance < 0.01) viewer_distance = 0.01;
        eye[0] = Math.sin(eye_theta*(Math.PI/180)) * viewer_distance + at[0];
        eye[2] = Math.cos(eye_theta*(Math.PI/180)) * viewer_distance + at[2];
        cameraMatrix = lookAt(eye, at, up);

        gl.useProgram(program1);
        gl.uniformMatrix4fv(cameraMatrixLoc, false, flatten(cameraMatrix));    
    };
    document.getElementById("camera_farther").onclick = function() {
        viewer_distance += 1;
        if (viewer_distance < 0.01) viewer_distance = 0.01;
        eye[0] = Math.sin(eye_theta*(Math.PI/180)) * viewer_distance + at[0];
        eye[2] = Math.cos(eye_theta*(Math.PI/180)) * viewer_distance + at[2];
        cameraMatrix = lookAt(eye, at, up);

        gl.useProgram(program1);
        gl.uniformMatrix4fv(cameraMatrixLoc, false, flatten(cameraMatrix));    
    };


    /***** KEYBOARD CONTROLS ******/
    
    document.onkeydown = function(e) {
        switch (e.key) {
            case "ArrowLeft": case "a": case "A":
                e.preventDefault();
                eye_theta -= 5;
                eye_theta %= 360;
                eye[0] = Math.sin(eye_theta*(Math.PI/180)) * viewer_distance + at[0];
                eye[2] = Math.cos(eye_theta*(Math.PI/180)) * viewer_distance + at[2];
                cameraMatrix = lookAt(eye, at, up);

                gl.useProgram(program1);
                gl.uniformMatrix4fv(cameraMatrixLoc, false, flatten(cameraMatrix));             
                break;

            case "ArrowRight": case "d": case "D":
                e.preventDefault();
                eye_theta += 5;
                eye_theta %= 360;
                eye[0] = Math.sin(eye_theta*(Math.PI/180)) * viewer_distance + at[0];
                eye[2] = Math.cos(eye_theta*(Math.PI/180)) * viewer_distance + at[2];
                cameraMatrix = lookAt(eye, at, up);
                
                gl.useProgram(program1);
                gl.uniformMatrix4fv(cameraMatrixLoc, false, flatten(cameraMatrix));
                break;

            case "ArrowUp": case "e": case "E":
                e.preventDefault();
                eye[1] += 0.5;
                cameraMatrix = lookAt(eye, at, up);

                gl.useProgram(program1);
                gl.uniformMatrix4fv(cameraMatrixLoc, false, flatten(cameraMatrix));
                break;

            case "ArrowDown": case "q": case "Q":
                e.preventDefault();
                eye[1] -= 0.5;
                cameraMatrix = lookAt(eye, at, up);

                gl.useProgram(program1);
                gl.uniformMatrix4fv(cameraMatrixLoc, false, flatten(cameraMatrix));
                break;

            case " ":
                e.preventDefault();

                toggleAnimation();
                break;

            case "w":
            case "W":
                e.preventDefault();
                at[1] += 0.4;
                cameraMatrix = lookAt(eye, at, up);

                gl.useProgram(program1);
                gl.uniformMatrix4fv(cameraMatrixLoc, false, flatten(cameraMatrix));
                break;

            case "s":
            case "S":
                e.preventDefault();
                at[1] -= 0.4;
                cameraMatrix = lookAt(eye, at, up);

                gl.useProgram(program1);
                gl.uniformMatrix4fv(cameraMatrixLoc, false, flatten(cameraMatrix));
                break;
            default: break;
        }
    }
    
    document.getElementById("gl-canvas").onwheel = function zoom(event) {
        event.preventDefault();
      
        viewer_distance += event.deltaY * 0.01;
        if (viewer_distance < 0.01) viewer_distance = 0.01;
        eye[0] = Math.sin(eye_theta*(Math.PI/180)) * viewer_distance + at[0];
        eye[2] = Math.cos(eye_theta*(Math.PI/180)) * viewer_distance + at[2];
        cameraMatrix = lookAt(eye, at, up);

        gl.useProgram(program1);
        gl.uniformMatrix4fv(cameraMatrixLoc, false, flatten(cameraMatrix));
    }
      


    for (i=0; i<numNodes; i++)
        initNodes(i);

    render();
}


function render() {

    if (motionBlur) {

        var theta_temp = [...theta];    // save it for later

        if (animationOn) {
            // Update arrays for motion blur
            prevPrevFrame = [...prevFrame];
            prevFrame = [...theta];
        }

        // 1: DRAW ON TEXTURES
        gl.useProgram(program1);

        // Bind framebuffer:
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);


        // Draw previous-previous frame on texture2:
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture2, 0);
        gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer2);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer2);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        theta = [...prevPrevFrame];
        for (var i = 0; i < numCatParts; i++)
            initNodes(i);
        traverse(torsoId);
        traverse(carpetId);


        // Draw previous frame on texture3:
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture3, 0);
        gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer3);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer3);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        theta = [...prevFrame];
        for (var i = 0; i < numCatParts; i++)
            initNodes(i);
        traverse(torsoId);
        traverse(carpetId);


        // Draw current frame on texture4:
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture4, 0);
        gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer4);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer4);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        theta = [...theta_temp];

    }
    else {  // (no motion blur)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        gl.useProgram(program1);
    }

    if (animationOn) {

        if (currentFrame >= framesBetweenKeyFrames - 1) {       // if you've finished the in-between frames
            currentFrame = 0;
            currentKeyFrame += 1;                               // pass to the next keyframe
            if (stopAfterEachKeyFrame) toggleAnimation();
        }

        if (currentKeyFrame >= numKeyFrames - 1) {              // if you've finished the keyframes
            if (tailLoop) {
                currentKeyFrame = startTailLoop;
                currentFrame = 0;
            }
            else {
                theta = keyFrames[currentKeyFrame];             // draw the final frame and then stop
                toggleAnimation();
            }
        }
        else {
            var perc = currentFrame/framesBetweenKeyFrames;
            for (var i = 0; i < theta.length; i++)
                theta[i] = (1 - perc) * keyFrames[currentKeyFrame][i] + perc * keyFrames[currentKeyFrame + 1][i];
            currentFrame += 1;
        }
    }
    for (var i = 0; i < numCatParts; i++)
        initNodes(i);

    traverse(torsoId);
    traverse(carpetId);


    if (motionBlur) {

        // Draw ONLY THE CAT on texture5:
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture5, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        traverse(torsoId);


        // Unbind framebuffer:
        gl.bindFramebuffer( gl.FRAMEBUFFER, null);


        // 2: DRAW ON SCREEN
        gl.useProgram(program2);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Draw square on which the texture will be drawn
        gl.drawArrays(gl.TRIANGLE_FAN, 24, 4);              // the first 4*6 = 24 vertices are for the cube
    }

    
    requestAnimationFrame(render);
}
