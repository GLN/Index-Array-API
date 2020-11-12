
/**
 * @file index_array.js
 * @author Gregory Lee Newsome <greg.newsome@utoronto.ca>
 * @overview Core support for generating & filtering an index array. You 
 * include() this file rather than access it directly -- see example.js.
 */

// object
// ------------------------------------------------------------------------ //

inlets = 1;
outlets = 2;

// const (ES 5)
// ------------------------------------------------------------------------ //

var QUAD = 4;
var TRI = 3;

// global
// ------------------------------------------------------------------------ //

g = new Global('index_array');
g.draw = false;
g.matrix = new JitterMatrix(1, 'long', 1, 1);
g.surface = new Surface([20, 20], QUAD);
g.filter = new Filter(g.surface);

// class
// ------------------------------------------------------------------------ //

/**
 * @classdesc Class for holding an index array defining a face.
 */
function Face(index_array, visible) {
	
	/** 
	 * Array of length QUAD or TRI. Each element is a vertex ID. Order of array 
	 * is how to connect them to form a face.
	 * @param {!Array<number>} index_array
	 */
	this._index_array = index_array;
	
	/** 
	 * Flag to determine visibility of face (0 or 1).
	 * @param {number} visible
	 */
	this._visible = visible;
	
	this.index_array = function()
	{
		return this._index_array;
	}
	
	this.set_index_array = function(index_array)
	{
		this._index_array = index_array;
	}
	
	this.visible = function()
	{
		return this._visible;
	}
	
	this.set_visible = function(visible)
	{
		this._visible = visible;
	}
	
	/** 
	 * Print object state to console.
	 */
	this.print = function()
	{
		post(this.index_array(), '--', this.visible(), '\n');
	}
	
}

/**
 * @classdesc Class for generating & applying a filter to a surface.
 */
function Filter(surface) {
	
	/** 
	 * Array of length surface.face_count(), forming a bit mask controlling the
	 * visibility of each face of a surface (0 or 1).
	 * @param {!Array<number>} mask
	 */
	this._mask = [];
	
	/** 
	 * Surface to apply filter to.
	 * @param {!Surface} surface
	 */
	this._surface = surface;
	
	this.mask = function()
	{
		return this._mask;
	}
	
	this.set_mask = function(mask)
	{
		this._mask = mask;
	}
	
	this.surface = function()
	{
		return this._surface;
	}
	
	this.set_surface = function(surface)
	{
		this._surface = surface;
	}
	
	/**
	 * Apply bit mask to each face of a surface. First reset visibility to 
	 * prevent cumulative filtering.
	 */
	this.apply = function()
	{
		this.surface().face_array().forEach(function(face, i) {
			face.set_visible(1); // reset
			face.set_visible(this.mask()[i]);
		}, this);
	}
	
	/**
	 * Generate & apply a bit mask.
	 * @param {function(): number} func Function returning 0 or 1.
	 * @param {number} order Flag determining whether to call func() directly 
	 * or in face order (0 or 1).
	 */
	this.generate = function(func, order)
	{
		var a = [];
		
		if (order) {
			// call func() in face order (counterclockwise, near to far)
			for (i = 0; i < this.surface().dim()[1] - 1; i++) {
				for (j = 0; j < this.surface().dim()[0] - 1; j++) {
					a.push(func());
				}
			}
			// if surface draw mode is TRI, repeat far to near
			if (this.surface().draw_mode() == TRI) {
				for (i = this.surface().dim()[1] - 1; i > 0; i--) {
					for (j = this.surface().dim()[0]; j > 1; j--) {
						a.push(func());
					}
				}
			}
		} else {
			// otherwise, just iterate & call func()
			for (i = 0; i < this.surface().face_count(); i++) {
				a.push(func());
			}
		}
		this.set_mask(a);
		this.apply();
	}
	
}

/**
 * @classdesc Class for generating, holding, and exporting an index array 
 * defining a surface.
 */
function Surface(dim, draw_mode) {
	
	/** 
	 * Array of length 2. Dimension of surface.
	 * @param {!Array<number>} dim
	 */
	this._dim = dim;
	
	/** 
	 * Array of length (dim[0] - 1) * (dim[1] - 1) containing every face of a 
	 * surface.
	 * @param {!Array<Face>} face_array
	 */
	this._face_array = [];
	
	/** 
	 * Draw mode of surface (4 or 3, i.e. QUAD or TRI).
	 * @param {number} draw_mode
	 */
	this._draw_mode = draw_mode;
	
	this.dim = function()
	{
		return this._dim;
	}
	
	this.set_dim = function(dim)
	{
		this._dim = dim;
	}
	
	this.face_array = function()
	{
		return this._face_array;
	}
	
	this.set_face_array = function(face_array)
	{
		this._face_array = face_array;
	}
	
	this.draw_mode = function()
	{
		return this._draw_mode;
	}
	
	this.set_draw_mode = function(draw_mode)
	{
		this._draw_mode = draw_mode;
	}
	
	this.face_count = function()
	{
		return this.face_array().length;
	}
	
	/** 
	 * Generate a surface for current draw mode (QUAD or TRI).
	 */
	this.generate = function()
	{
		this.draw_mode() == QUAD ? this.quad_grid() : this.tri_grid();
	}
	
	/** 
	 * Aggregate & return index array for surface, respecting face visibility.
	 * @return {!Array<number>} index_array
	 */
	this.index_array = function()
	{
		var index_array;
		
		// return index array or zero array depending on face visibility
		index_array = this.face_array().map(function(face) {
			if (face.visible()) {
				return face.index_array();
			} else {
				return this.draw_mode() == QUAD ? [0, 0, 0, 0] : [0, 0, 0];
			}
		}, this);
		// flatten
		index_array = [].concat.apply([], index_array);
		return index_array;
	}
	
	/** 
	 * Populate & return matrix containing index array for surface.
	 * @return {!JitterMatrix<number>} matrix
	 */
	this.matrix = function()
	{
		var index_array = this.index_array();
		var matrix = new JitterMatrix(1, 'long', index_array.length, 1);
		
		index_array.forEach(function(index, i) {
			matrix.setcell2d(i, 0, index);
		});
		return matrix;
	}
	
	/** 
	 * Print object state to console.
	 */
	this.print = function()
	{
		this.face_array().forEach(function(face) {
			face.print();
		});
	}
	
	/** 
	 * Mimic output of [jit.gl.mesh] @draw_mode quad_grid.
	 */
	this.quad_grid = function()
	{
		var face;
		var face_array = [];
		var index_array = [];
		var start = 0;
		
		// stack (near to far)
		for (i = 0; i < this.dim()[1] - 1; i++) {
			// sector (counterclockwise from 3 o'clock)
			start = i * this.dim()[0];
			for (j = 0; j < this.dim()[0] - 1; j++) {
				index_array = [];
				index_array.push(start + j + 1);
				index_array.push(start + j);
				index_array.push(start + j + this.dim()[0]);
				index_array.push(start + j + this.dim()[0] + 1);
				face = new Face(index_array, 1);
				face_array.push(face);
			}
		}
		this.set_face_array(face_array);
	}
	
	/** 
	 * Mimic output of [jit.gl.mesh] @draw_mode tri_grid.
	 */
	this.tri_grid = function()
	{
		var face;
		var face_array = [];
		var index_array = [];
		var start = 0;
		
		// stack (near to far, half of surface)
		for (i = 0; i < this.dim()[1] - 1; i++) {
			// sector (counterclockwise from 3 o'clock)
			start = i * this.dim()[0] + 1;
			for (j = 0; j < this.dim()[0] - 1; j++) {
				index_array = [];
				index_array.push(start + j);
				index_array.push(start + j + this.dim()[0] - 1);
				index_array.push(start + j + this.dim()[0]);
				face = new Face(index_array, 1);
				face_array.push(face);
			}
		}
		// stack (far to near, half of surface)
		for (i = this.dim()[1] - 1; i > 0; i--) {
			// sector
			start = (i + 1) * this.dim()[0];
			for (j = this.dim()[0]; j > 1; j--) {
				index_array = [];
				index_array.push(start - j - this.dim()[0]);
				index_array.push(start - j);
				index_array.push(start - j - this.dim()[0] + 1);
				face = new Face(index_array, 1);
				face_array.push(face);
			}
		}
		this.set_face_array(face_array);
	}
	
}

// API
// ------------------------------------------------------------------------ //

/**
 * Send surface face count from rightmost outlet of [js] object, and if the 
 * global draw flag is true, send index array in matrix format from leftmost 
 * outlet.
 */
function bang()
{
	if (g.draw == true) {
		g.matrix.freepeer();
		g.matrix = g.surface.matrix();
		outlet(0, 'jit_matrix', g.matrix.name);
		g.draw = false;
	}
	outlet(1, g.surface.face_count());
}

/**
 * Set surface dimension with message [dim x y].
 */
function dim()
{
	var a = arrayfromargs(arguments);
	
	if (a.length == 2 && a[0] > 0 && a[1] > 0) {
		g.surface.set_dim(a);
		g.surface.generate();
		g.draw = true;
	}
}

/**
 * Set surface draw mode with message [draw_mode quads] or 
 * [draw_mode triangles].
 */
function draw_mode(draw_mode)
{
	if (draw_mode == 'quads' || draw_mode == 'triangles') {
		draw_mode = draw_mode == 'quads' ? QUAD : TRI; // map str to int
		g.surface.set_draw_mode(draw_mode);
		g.surface.generate();
		g.draw = true;
	}
}

/**
 * Print overview of program state to console with message [info].
 */
function info()
{
	post('g.filter.mask().length', g.filter.mask().length, '\n');
	post('g.surface.dim()', g.surface.dim(), '\n');
	post('g.surface.face_count()', g.surface.face_count(), '\n');
	post('g.surface.draw_mode()', g.surface.draw_mode(), '\n');
}

/**
 * Filter surface with a list of length face count. Use an element value of 
 * 0 or 1 to hide or show each face.
 */
function list()
{
	var a = arrayfromargs(arguments);
	
	g.filter.set_mask(a);
	g.filter.apply();
	g.draw = true;
}
