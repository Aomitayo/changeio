'use strict';
var chai = require('chai');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
var sinon = require('sinon');
chai.use(sinonChai);

var ChangeIO = require('../');

describe('ChangeIO', function(){

	beforeEach(function(){
		this.changeioOptions = {};
		this.changeio = new ChangeIO(this.changeioOptions);
	});

	afterEach(function(){
		this.changeio.io.close();
	});

	it('pushes changes to connected clients', function(done){
		var test = this;
		test.changeio.qualify('stock.#');
		test.changeio.io.listen(5000);
		var client = require('socket.io-client').connect('http://localhost:5000', {path:'/changeio'});
		client.on('connect', function(){
			client.on('change', function(qualifier, change){
				expect(qualifier).to.match(/stock.nyse.google/);
				expect(change).to.have.property('update');
				expect(change.update).to.have.property('price', 560034.233);
				done();
			});

			test.changeio.push('stock.nyse.google', {update:{price: 560034.233}}, function(err){
				if(err){done(err);}
			});
		});
	});
});
