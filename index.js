let request = require('request');
let _ = require('lodash');
let mkdirp = require('mkdirp-promise');
let fs = require('fs');
let when = require('when');

let themeDir = 'theme';
let templatesDir = themeDir+'/templates';
let dir = mkdirp(templatesDir);


let writeToFile = function(promisesArr, filename, content) {
	let defer = when.defer();
	promisesArr.push(defer);
	dir.then(function() {
		fs.writeFile(filename, content, function(err) {
			if (err) { console.error(err); defer.reject(err); return; }
			defer.resolve();
		});
	})
}


let download = function(config) {
	let filesPromises = [];
	let defer = when.defer();

	request.get('https://'+config.HOST+'/hc/admin/themes/'+config.THEME_ID+'?extended=true', {
		headers: {
			'Cookie': config.COOKIE,
			'X-CSRF-Token': config.CSRF_TOKEN,
			'X-Requested-With': 'XMLHttpRequest'
		},
		json: true
	}, function(err, res, body) {
		if (err) { console.error(err); defer.reject(err); return; }

		// writeToFile(filesPromises, themeDir+'/raw-data.json', JSON.stringify(body, null, 2));
		writeToFile(filesPromises, themeDir+'/javascript.js', body.javascript);
		writeToFile(filesPromises, themeDir+'/stylesheet.scss', body.stylesheet);
		_.forEach(body.templates, function(t) {
			writeToFile(filesPromises, templatesDir+'/'+t.identifier+'.hbs', t.body);
		});
		defer.resolve();
	});

	return defer.promise
		.then(function() { return when.all(filesPromises) })
		.then(function() {
			// console.log('Downloading theme files - Done', res.statusCode);
		})
}

let _upload = function(config, themeContent) {
	let defer = when.defer();
	request('https://'+config.HOST+'/hc/admin/themes/'+config.THEME_ID, {
		method: 'PUT',
		headers: {
			'Cookie': config.COOKIE,
			'X-CSRF-Token': config.CSRF_TOKEN,
			'X-Requested-With': 'XMLHttpRequest'
		},
		body: {
			id: config.THEME_ID,
			javascript: themeContent.javascript,
			stylesheet: themeContent.stylesheet,
			templates_attributes: themeContent.templates,
		},
		json: true
	}, function(err, res, body) {
		if (err) { console.error(err); defer.reject(err); return; }
		defer.resolve();
	});
	return defer.promise;
}


let publish = function(config) {
	let defer = when.defer();
	options = {
		method: 'PUT',
		headers: {
			'Cookie': config.COOKIE,
			'X-CSRF-Token': config.CSRF_TOKEN,
			'X-Requested-With': 'XMLHttpRequest'
		},
		body: {
			id: config.HC_ID,
			theme_id: config.THEME_ID,
			draft_theme_id: config.THEME_ID,
			state: 'enabled',
		},
		json: true
	}
	request('https://'+config.HOST+'/hc/admin/help_centers/'+config.THEME_ID, options, function(err, res, body) {
		if (err) { console.error(err); defer.reject(err); return; }
		// console.log('Publishing theme - Step 1 Done', res.statusCode);
		request('https://'+config.HOST+'/hc/admin/help_centers/'+config.THEME_ID+'/apply', options, function(err, res, body) {
			if (err) { console.error(err); defer.reject(err); return; }
			// console.log('Publishing theme - Done', res.statusCode);
			defer.resolve();
		});
	});
	return defer.promise;
}


let processContent = function() {
	let templates  = [];
	let stylesheet = null;
	let javascript = null;
	let promises   = [];

	let htmlDefer = when.defer();
	promises.push(htmlDefer.promise);
	fs.readdir(templatesDir, function(err, filenames) {
		if (err) { console.error(err); htmlDefer.reject(err); return; }
		let filesPromises = [];
		_.forEach(filenames, function(fileName) {
			let fileDefer = when.defer();
			filesPromises.push(fileDefer.promise);
			fs.readFile(templatesDir+'/'+fileName, 'utf-8', function(err, content) {
				if (err) { console.error(err); fileDefer.reject(err); return; }
				let name = fileName.split('.')[0]
				templates.push({ identifier: name, body: content });
				fileDefer.resolve();
			});
		});
		when.all(filesPromises)
		.then(function() { htmlDefer.resolve(); })
	});

	let cssDefer = when.defer();
	promises.push(cssDefer.promise);
	fs.readFile(themeDir+'/stylesheet.scss', 'utf-8', function(err, content) {
		if (err) { console.error(err); cssDefer.reject(err); return; }
		stylesheet = content;
		cssDefer.resolve();
	});

	let jsDefer = when.defer();
	promises.push(jsDefer.promise);
	fs.readFile(themeDir+'/javascript.js', 'utf-8', function(err, content) {
		if (err) { console.error(err); jsDefer.reject(err); return; }
		javascript = content;
		jsDefer.resolve();
	});

	return when.all(promises)
		.then(function() {
			// console.log('Processing local theme files - Done');
			return { templates, stylesheet, javascript }
		})
}


let upload = function(config) {
	return processContent()
		.then(function(content) { return _upload(config, content); })
}


module.exports = {
	download,
	upload,
	publish
}
