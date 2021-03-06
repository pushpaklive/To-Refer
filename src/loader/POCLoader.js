

/**
 * @class Loads mno files and returns a PointcloudOctree
 * for a description of the mno binary file format, read mnoFileFormat.txt
 * 
 * @author Markus Schuetz
 */
function POCLoader(){
	
}
 
/**
 * @return a point cloud octree with the root node data loaded. 
 * loading of descendants happens asynchronously when they're needed
 * 
 * @param url
 * @param loadingFinishedListener executed after loading the binary has been finished
 */
POCLoader.load = function load(url) {
	try{
		var pco = new Potree.PointCloudOctreeGeometry();
		pco.url = url;
		var xhr = new XMLHttpRequest();
		xhr.open('GET', url, false);
		xhr.send(null);
		if(xhr.status === 200 || xhr.status === 0){
			var fMno = JSON.parse(xhr.responseText);
			if(Potree.utils.pathExists(fMno.octreeDir + "/r")){
				pco.octreeDir = fMno.octreeDir;
			}else{
				pco.octreeDir = url + "/../" + fMno.octreeDir;
			}
			
			var nodes = {};
			
			{ // load root
				var name = "r";
				var min = new THREE.Vector3(fMno.boundingBox.lx, fMno.boundingBox.ly, fMno.boundingBox.lz);
				var max = new THREE.Vector3(fMno.boundingBox.ux, fMno.boundingBox.uy, fMno.boundingBox.uz);
				var boundingBox = new THREE.Box3(min, max);
				pco.boundingBox = boundingBox;
				
				var root = new Potree.PointCloudOctreeGeometryNode(name, pco, boundingBox);
				root.level = 0;
				root.numPoints = fMno.hierarchy[0][1];
				pco.root = root;
				pco.root.load();
				nodes[name] = root;
			}
			
			// load remaining hierarchy
			for( var i = 1; i < fMno.hierarchy.length; i++){
				var name = fMno.hierarchy[i][0];
				var numPoints = fMno.hierarchy[i][1];
				var index = parseInt(name.charAt(name.length-1));
				var parentName = name.substring(0, name.length-1);
				var parentNode = nodes[parentName];
				var points = fMno.hierarchy[i][1];
				var level = name.length-1;
				var boundingBox = POCLoader.createChildAABB(parentNode.boundingBox, index);
				
				var node = new Potree.PointCloudOctreeGeometryNode(name, pco, boundingBox);
				node.level = level;
				node.numPoints = numPoints;
				parentNode.addChild(node);
				nodes[name] = node;
			}
			
			pco.nodes = nodes;
			
		}
		
		return pco;
	}catch(e){
		console.log("loading failed: '" + url + "'");
		console.log(e);
	}
};

POCLoader.loadPointAttributes = function(mno){
	
	var fpa = mno.pointAttributes;
	var pa = new PointAttributes();
	
	for(var i = 0; i < fpa.length; i++){   
		var pointAttribute = PointAttribute[fpa[i]];
		pa.add(pointAttribute);
	}                                                                     
	
	return pa;
};


POCLoader.createChildAABB = function(aabb, childIndex){
	var V3 = THREE.Vector3;
	var min = aabb.min;
	var max = aabb.max;
	var dHalfLength = new THREE.Vector3().copy(max).sub(min).multiplyScalar(0.5);
	var xHalfLength = new THREE.Vector3(dHalfLength.x, 0, 0);
	var yHalfLength = new THREE.Vector3(0, dHalfLength.y, 0);
	var zHalfLength = new THREE.Vector3(0, 0, dHalfLength.z);

	var cmin = min;
	var cmax = new THREE.Vector3().add(min).add(dHalfLength);

	var min, max;
	if (childIndex === 1) {
		min = new THREE.Vector3().copy(cmin).add(zHalfLength);
		max = new THREE.Vector3().copy(cmax).add(zHalfLength);
	}else if (childIndex === 3) {
		min = new THREE.Vector3().copy(cmin).add(zHalfLength).add(yHalfLength);
		max = new THREE.Vector3().copy(cmax).add(zHalfLength).add(yHalfLength);
	}else if (childIndex === 0) {
		min = cmin;
		max = cmax;
	}else if (childIndex === 2) {
		min = new THREE.Vector3().copy(cmin).add(yHalfLength);
		max = new THREE.Vector3().copy(cmax).add(yHalfLength);
	}else if (childIndex === 5) {
		min = new THREE.Vector3().copy(cmin).add(zHalfLength).add(xHalfLength);
		max = new THREE.Vector3().copy(cmax).add(zHalfLength).add(xHalfLength);
	}else if (childIndex === 7) {
		min = new THREE.Vector3().copy(cmin).add(dHalfLength);
		max = new THREE.Vector3().copy(cmax).add(dHalfLength);
	}else if (childIndex === 4) {
		min = new THREE.Vector3().copy(cmin).add(xHalfLength);
		max = new THREE.Vector3().copy(cmax).add(xHalfLength);
	}else if (childIndex === 6) {
		min = new THREE.Vector3().copy(cmin).add(xHalfLength).add(yHalfLength);
		max = new THREE.Vector3().copy(cmax).add(xHalfLength).add(yHalfLength);
	}
	
	return new THREE.Box3(min, max);
};


