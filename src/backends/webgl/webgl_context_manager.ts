/**
 * @license
 * Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
import {ENV} from '../../environment';

import {cleanupDOMCanvasWebGLRenderingContext, createDOMCanvasWebGLRenderingContext} from './canvas_util';

let contexts: {[key: string]: WebGLRenderingContext} = {};
let contextFactory: (version: number) => WebGLRenderingContext = null;
let contextCleanup: (context: WebGLRenderingContext) => void = null;

/**
 * Sets callback for creating new WebGLRenderingContext instances.
 * @param factory The callback function that returns a WebGLRenderingContext
 *     instance.
 */
export function setContextFactory(
    factory: (version: number) => WebGLRenderingContext) {
  contextFactory = factory;

  // Clear out items (TODO kreeger): write a unit test for this?
  for (const ctx in contexts) {
    console.log('ctx: ' + ctx);
  }
  contexts = {};
}

/**
 * TODO(kreeger): doc me.
 * @param cleanup
 */
export function setContextCleanup(
    cleanup: (context: WebGLRenderingContext) => void) {
  contextCleanup = cleanup;
}

/**
 * Returns the current WebGLContext
 */
export function getActiveContext(): WebGLRenderingContext {
  return getContextByVersion(ENV.getNumber('WEBGL_VERSION'));
}

/**
 *  TODO(kreeger): Doc me.
 * @param version The specific version of WebGL to request.
 */
export function getContextByVersion(version: number): WebGLRenderingContext {
  // Default to browser context creation is running in the browser.
  if (contextFactory == null) {
    if (ENV.getBool('IS_BROWSER')) {
      // TODO - is there a better place to register this?
      contextFactory = createDOMCanvasWebGLRenderingContext;
    } else {
      throw new Error('Default WebGLRenderingContext factory was not set!');
    }
  }

  if (!(version in contexts)) {
    contexts[version] = contextFactory(version);
    bootstrapWebGLContext(contexts[version]);
  }
  const gl = contexts[version];
  if (gl.isContextLost()) {
    disposeWebGLContext(version);
    return getContextByVersion(version);
  }
  return contexts[version];
}

/**
 * TODO(kreeger): Doc me.
 */
export function disposeActiveContext() {
  disposeWebGLContext(ENV.getNumber('WEBGL_VERSION'));
}

function disposeWebGLContext(version: number) {
  if ((version in contexts)) {
    if (contextCleanup == null) {
      if (ENV.getBool('IS_BROWSER')) {
        // TODO - is there a better place to register this?
        contextCleanup = cleanupDOMCanvasWebGLRenderingContext;
      }
    }
    if (contextCleanup != null) {
      contextCleanup(contexts[version]);
    }
    delete contexts[version];
  }
}

function bootstrapWebGLContext(gl: WebGLRenderingContext) {
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.STENCIL_TEST);
  gl.disable(gl.BLEND);
  gl.disable(gl.DITHER);
  gl.disable(gl.POLYGON_OFFSET_FILL);
  gl.disable(gl.SAMPLE_COVERAGE);
  gl.enable(gl.SCISSOR_TEST);
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);
}
