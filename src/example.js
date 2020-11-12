
/**
 * @file example.js
 * @author Gregory Lee Newsome <greg.newsome@utoronto.ca>
 * @overview Execute this file with Max's [js] object. Connect the leftmost 
 * outlet of [js] to the index array inlet of [jit.gl.mesh], and ensure that 
 * @draw_mode quads or triangles is set on the latter. Send a bang to [js] to 
 * generate a new index array. Specify a filter to remove part of a surface, 
 * either by sending a list to the [js] object, or generating a list in JS.
 */

// include
// ------------------------------------------------------------------------ //

/**
 * You must include index_array.js for core functionality.
 */
include('index_array.js');

// specifying & applying a filter
// ------------------------------------------------------------------------ //

/**
 * Show entire surface with message [fill]. The anonymous function will return 
 * 1, setting the visibility of each face of the surface to true. You must set 
 * the global draw flag to true whenever you generate or modify a filter.
 */
function fill()
{
	g.filter.generate(function() {
		return 1;
	});
	g.draw = true;
}

/**
 * Show random part of the surface with message [random], with an optional 
 * density argument. The anonymous function will return either 0 or 1.
 * @param {number} density Density of distribution.
 */
function random(density)
{
	density = typeof density == 'undefined' ? 1 : density;
	
	g.filter.generate(function() {
		with (Math) {
			return round(pow(random(), 1.0 / density));
		}
	});
	g.draw = true;
}

/**
 * Show reverse of surface with message [reverse]. Rather than generate a 
 * filter, you can use the current filter to create a new filter. Use 
 * g.filter.mask() to access the current filter, and ensure that you call 
 * apply() after setting your new filter, which you do via set_mask().
 */
function reverse()
{
	var a = g.filter.mask().map(function(bit, i) {
		return 1 - bit;
	});
	g.filter.set_mask(a);
	g.filter.apply();
	g.draw = true;
}

/**
 * Show ring effect with message [ring]. You can choose to apply an 
 * anonymous function in face order -- counterclockwise, near to far -- by 
 * passing true as a second argument to filter.generate(). The variables i & j 
 * of that method are available to you, representing face sector & stack 
 * respectively.
 * @param {number} count Face count per ring.
 */
function ring(count)
{
	g.filter.generate(function() {
		return i % count > 0;
	}, true);
	g.draw = true;
}

/**
 * Show spiral effect with message [spiral]. You can use not only i & j from 
 * filter.generate() but also the surface dimension to craft a filter.
 */
function spiral()
{
	g.filter.generate(function() {
		return i < (g.surface.dim()[0] * (i % g.surface.dim()[1])) ? 0 : 1;
	});
	g.draw = true;
}
