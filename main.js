/**
 * @param {Array} hexes array of arbitrary data
 */
function hexGrid(hexes) {
  const htmlHexGrid = document.querySelector('.hexagon-grid');
  const _helpers = {
    deltaX: 0,
    deltaY: 0,
    offsetX: 0,
    offsetY: 0,
    x: 0,
    y: 0,
  };
  const _neighbourCoords = [
    {x: 1, y: 0, z: -1}, {x: 1, y: -1, z: 0},
    {x: 0, y: -1, z: 1}, {x: -1, y: 0, z: 1},
    {x: -1, y: 1, z: 0}, {x: 0, y: 1, z: -1},
  ];
  let _throttleCount = 0;
  let _grid = [...hexes,];

  /**
   * @desc initialize the grid
   * calculate the number of hexes and layers
   * populate missing places in array to form perfect grid
   * construct hex matrix for every item in array
   */
  function initGrid() {
    const gridLen = _grid.length;
    if (!gridLen)
      return;

    let layers = 1; // start from 1 to skip one iteration trough loop
    let perfectGridCount = 0; // number of hexagons to form perfect grid

    // calculate layers
    // first layers has 6 elements, next 12, next 18 and so on...
    while (gridLen > perfectGridCount) {
      perfectGridCount += layers * 6;
      layers += 1;
    }
    layers -= 1;
    const matrix = _constructMatrix(layers);

    // populate grid with empty data to form perfect hexagon grid
    while (_grid.length <= perfectGridCount) {
      _grid.push(Math.floor(Math.random() * -10000));
    }
    // merge grid with matrix so every hex has its own coords
    _grid = _grid.map((hex, i) => Object.assign({}, {
      data: hex,
    }, {
      matrix: matrix[i],
    }));

    _grid.forEach(_findNeighbors);
    _grid.forEach(_renderHex);
    return _grid;
  }

  /**
   * @desc construct blank hexagon matrix
   * @param {Number} layers number of layers grid will have
   */
  function _constructMatrix(layers) {
    const matrix = [];
    for (let x = -layers; x <= layers; x++) {
      const r1 = Math.max(-layers, -x - layers);
      const r2 = Math.min(layers, -x + layers);
      for (let y = r1; y <= r2; y++) {
        const z = -x - y;
        const scale = (Math.abs(x) + Math.abs(y) + Math.abs(z)) / 2;
        matrix.push({
          x,
          y,
          z,
          scale,
        });
      }
    }
    // center elements, hex with x: 0, y: 0, z: 0 will be first element in the array and so on
    matrix.sort((a, b) => {
      return (Math.abs(a.x) + Math.abs(a.y) + Math.abs(a.z) - (Math.abs(b.x) + Math.abs(b.y) + Math.abs(b.z)));
    });
    return matrix;
  }

  /**
   * @desc find neighbour hexagons for each hex in the grid
   * @param {Object} hex
   * @param {Number} _
   * @param {Array} grid
   */
  function _findNeighbors(hex, _, grid) {
    _neighbourCoords.forEach((n, i) => {
      let neighbourHex = grid.find(h => hex.matrix.x + n.x === h.matrix.x && hex.matrix.y + n.y === h.matrix.y);

      if (neighbourHex && !neighbourHex.matrix._rendered) {
        neighbourHex.matrix.scale = (Math.abs(neighbourHex.matrix.x) + Math.abs(neighbourHex.matrix.y) + Math.abs(neighbourHex.matrix.z)) / 2;
        neighbourHex.matrix.coords = _calculateDelta(hex, i);
        neighbourHex.matrix._rendered = true;
      }
    });
    return hex;
  }

  /**
   * @desc calculate coordinations for hex position / distance from center
   * @param {Object} hex hexagon object
   * @param {Object} neighbourHex neighbour hexagon object that's being populated
   * @param {Number} i index of neighbour, used to calculate offset angle between central hex and neighbour
   */
  function _calculateDelta(hex, i) {
    const angleDeg = 60 * i - 30;
    const angleRad = (Math.PI / 180) * angleDeg;
    const cX = hex.matrix.coords ? hex.matrix.coords.x : 0;
    const cY = hex.matrix.coords ? hex.matrix.coords.y : 0;
    const x = cX + Math.cos(angleRad);
    const y = cY + Math.sin(angleRad);
    if (x > _helpers.offsetX) _helpers.offsetX = x;
    if (y > _helpers.offsetY) _helpers.offsetY = y;

    return {x, y};
  }

  /**
   * @desc create HTML node for hex
   * @param {Object} hex
   */
  function _renderHex(hex) {
    const xAxis = hex.matrix.coords.x + _helpers.deltaX;
    const yAxis = hex.matrix.coords.y + _helpers.deltaY;
    const axis = (Math.abs(xAxis) + Math.abs(yAxis)) / 2 / 4;
    const scale = axis > 1 ? 0.1 : 1 - axis;
    const hexNode = document.createElement('div');
    hexNode.classList.add('hex');
    hexNode.style.cssText = `transform: scale(${scale}) translate3d(${ (xAxis * 100 - 50) / scale}%, ${ (-(yAxis * 100) - 50) / scale}%, 0);`;
    hex.htmlNode = hexNode;

    htmlHexGrid.appendChild(hexNode);
    return hex;
  }

  /**
   * @desc update styles on hexes
   */
  function _moveHexes() {
    _grid.forEach(hex => {
      const xAxis = hex.matrix.coords.x + _helpers.deltaX;
      const yAxis = hex.matrix.coords.y + _helpers.deltaY;
      const axis = (Math.abs(xAxis) + Math.abs(yAxis)) / 2 / 4;
      const scale = axis > 1 ? 0.1 : 1 - axis;
      hex.htmlNode.style.cssText = `transform: scale(${scale}) translate3d(${ (xAxis * 100 - 50) / scale}%, ${ (-(yAxis * 100) - 50) / scale}%, 0);`;
    });
  }

  /**
   * @desc throttle event so the app won't do too many caluclations
   * delay it in order not to block UI and get 60FPS
   * @param {Object} e
   */
  function _handleMousemove(e) {
    // if hovering over hex, do nothing
    if (e.target.classList.contains('hexagon-grid')) {
      _throttleCount++;
      if (_throttleCount == 10) {
        setTimeout(() => {
          _calculateMove(e);
          _moveHexes();
          _throttleCount = 0;
        }, 25);
      }
    }
  }

  /**
   * @desc attach mouse move to parent element
   */
  function initEvents() {
    htmlHexGrid.addEventListener('mousemove', _handleMousemove);
  }

  /**
   * @desc remove mouse move envet
   */
  function removeEvents() {
    htmlHexGrid.removeEventListener('mousemove', _handleMousemove);
  }

  /**
   * @desc calculate difference from last move
   * @param {Object} evt
   */
  function _calculateMove(evt) {
    const divider = window.innerWidth > 640 ? 250 : 100;
    const offsetX = evt.offsetX || evt.layerX;
    const offsetY = evt.offsetY || evt.layerY;
    const x = (offsetX - _helpers.x) / divider;
    const y = (_helpers.y - offsetY) / divider;
    let dX = _helpers.deltaX + x;
    let dY = _helpers.deltaY + y;
    const multiplyX = dX < 0 ? -1 : 1;
    const multiplyY = dY < 0 ? -1 : 1;
    if (Math.abs(dX) > _helpers.offsetX) dX = _helpers.offsetX * multiplyX;
    if (Math.abs(dY) > _helpers.offsetY) dY = _helpers.offsetY * multiplyY;

    _helpers.deltaX = dX;
    _helpers.deltaY = dY;
    _helpers.x = offsetX;
    _helpers.y = offsetY;
  }

  return {
    initGrid,
    initEvents,
    removeEvents,
  };
}
