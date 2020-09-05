//=============================================================================
// RPG Maker MZ - God Ray Filter
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Add god ray effect to the game map.
 * @author Jim00000
 * @url https://github.com/Jim00000/RMMZ-Plugin-Collection/blob/master/JPC_GodRayFilter.js
 * @base JPC_Core
 * @help 
 * This is an official filter provided by PiXiJS (Alain Galvan). 
 * 
 * Visit https://pixijs.io/pixi-filters/tools/demo/ for a live demo of Godray 
 * filter.
 * 
 * https://pixijs.io/pixi-filters/docs/PIXI.filters.GodrayFilter.html offers 
 * details about every parameters. 
 * 
 * The shader file (godray.fs) comes from 
 * https://github.com/pixijs/pixi-filters/tree/master/filters/godray/src 
 * and has a few modifications.
 * 
 * In the map attribute's editor, you can set parameters to the map by writing 
 * following metadata with xml format in the note. Giving an example:
 * 
 * <jpc>
 *   <godrayfilter>
 *     <enable>true</enable>
 *     <delta>0.001</delta>
 *     <angle>15</angle>
 *     <gain>0.5</gain>
 *     <lacunrity>2.8</lacunrity>
 *     <parallel_light>false</parallel_light>
 *     <lightsource>[-100, -100]</lightsource>
 *   </godrayfilter>
 * </jpc>
 * 
 * Note that the filter will pick the default value defined in the plugin 
 * manager if you do not give specific value to the parameter in the xml.
 * 
 * @param delta
 * @text Delta
 * @type number
 * @default 0.01
 * @decimals 3
 * @min 0.0
 * @max 10.0
 * 
 * @param angle
 * @text Angle
 * @type number
 * @default 30.0
 * @decimals 3
 * @min 0.0
 * @max 360.0
 * 
 * @param gain
 * @text Gain
 * @type number
 * @default 0.6
 * @decimals 3
 * @min 0.0
 * 
 * @param lacunrity
 * @text Lacunrity
 * @type number
 * @default 2.8
 * @decimals 3
 * @min 0.0
 * 
 * @param parallel
 * @text Parallel light
 * @type boolean
 * @default false
 * 
 * @param lightsrc
 * @text light source
 * @type number[]
 * @decimals 3
 * @default [0.0, -100.0]
 * @min -10000.0
 * @max 10000.0
 */

(() => {
    'use strict';
    //=============================================================================
    // Fixed Parameters
    //=============================================================================
    const PLUGIN_NAME = "jpc_godrayfilter";
    const GOD_RAY_SHADER_PATH = "js/plugins/shaders/godray.fs";
    const PLUGINPARAMS = JPC.getPluginParams(PLUGIN_NAME);

    //=============================================================================
    // User-defined Parameters
    //=============================================================================
    const DELTA = parseFloat(PLUGINPARAMS['delta']);
    const ANGLE = parseFloat(PLUGINPARAMS['angle']);
    const GAIN = parseFloat(PLUGINPARAMS['gain']);
    const LACUNRITY = parseFloat(PLUGINPARAMS['lacunrity']);
    const IS_LIGHT_PARALLEL = JSON.parse(PLUGINPARAMS['parallel']);
    const LIGHTSRC_ARRAY = JSON.parse(PLUGINPARAMS['lightsrc']);
    const LIGHTSRC = [parseFloat(LIGHTSRC_ARRAY[0]), parseFloat(LIGHTSRC_ARRAY[1])];

    //=============================================================================
    // Help functions
    //=============================================================================

    function degToRad(degree) {
        return degree * Math.PI / 180.0;
    }

    function loadGLSLShaderFile(filePath) {
        const path = require("path"), fs = require("fs");
        const shaderFile = fs.readFileSync(path.resolve(filePath));
        return shaderFile;
    }

    function createGodRayFilter(_angle, _gain, _uLacunrity, _parallel, _lightsrc) {
        const fragShaderCode = loadGLSLShaderFile(GOD_RAY_SHADER_PATH).toString();
        const filter = new PIXI.Filter(PIXI.Filter.defaultVertexSrc, fragShaderCode, {
            angle: _angle,
            gain: _gain,
            uLacunrity: _uLacunrity,
            parallel: _parallel,
            dimensions: [Graphics.boxWidth, Graphics.boxHeight],
            aspect: Graphics.boxHeight / Graphics.boxWidth,
            light: _parallel ? [Math.cos(degToRad(_angle)), Math.sin(degToRad(_angle))] : _lightsrc,
            utime: 0
        });
        return filter;
    }

    function updateGodRayFilter(spritest_map) {
        spritest_map.godRayFilter.uniforms.utime += spritest_map.godRayFilterDelta;
        if (spritest_map.isGodRayLightParallel == false) {
            spritest_map.godRayFilter.uniforms.light[0] = spritest_map.godRayLightSource[0] - $gameMap.displayX() * $gameMap.tileWidth();
            spritest_map.godRayFilter.uniforms.light[1] = spritest_map.godRayLightSource[1] - $gameMap.displayY() * $gameMap.tileHeight();
        }
    }

    var _Spriteset_Map__initialize = Spriteset_Map.prototype.initialize;
    Spriteset_Map.prototype.initialize = function () {
        _Spriteset_Map__initialize.apply(this, arguments);
        this.isGodRayFilterApplied = JPC.parseNoteToBoolean($dataMap.note, "godrayfilter.enable");
        if (this.isGodRayFilterApplied) {
            this.godRayFilterDelta = JPC.parseNoteToFloat($dataMap.note, "godrayfilter.delta") || DELTA;
            this.isGodRayLightParallel = JPC.parseNoteToBoolean($dataMap.note, "godrayfilter.parallel_light") || IS_LIGHT_PARALLEL;
            this.godRayLightSource = JPC.parseNoteToNumArray($dataMap.note, "godrayfilter.lightsource") || LIGHTSRC;
            this.godRayFilter = createGodRayFilter(
                JPC.parseNoteToInt($dataMap.note, "godrayfilter.angle") || ANGLE,
                JPC.parseNoteToFloat($dataMap.note, "godrayfilter.gain") || GAIN,
                JPC.parseNoteToFloat($dataMap.note, "godrayfilter.lacunrity") || LACUNRITY,
                this.isGodRayLightParallel,
                this.godRayLightSource
            );
            this.filters.push(this.godRayFilter);
            this.godRayFilterUpdateHandler = updateGodRayFilter;
        }
    };

    var _Spriteset_Map__update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function () {
        _Spriteset_Map__update.apply(this, arguments);
        if (this.isGodRayFilterApplied) {
            this.godRayFilterUpdateHandler(this);
        }
    };

})();

/* MIT License

Copyright (c) 2020 Jim00000

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/