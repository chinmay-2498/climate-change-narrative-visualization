const state = {
  currentScene: null,
  scenes: {}
};

/**
 * Register a scene with a name and an object that implements show/hide
 * methods.  Scenes should call this during their initialisation.
 *
 * @param {string} name
 * @param {{show: function, hide: function}} sceneObj
 */
export function registerScene(name, sceneObj) {
  state.scenes[name] = sceneObj;
}

/**
 * Show the given scene and hide the previous one.  No-op if the scene is
 * already active.
 *
 * @param {string} name
 */
export function setScene(name) {
  if (state.currentScene === name) return;
  // hide previous scene
  if (state.currentScene && state.scenes[state.currentScene]) {
    state.scenes[state.currentScene].hide();
  }
  state.currentScene = name;
  // show new scene
  if (state.scenes[name]) {
    state.scenes[name].show();
  }
}