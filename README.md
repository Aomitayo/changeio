# changeio
A package for publishing resource and entity changes from nodejs servers to clients over websockets

## Installation

```
npm install changeio
```

## Usage

### On server

```
//create change io server
var changeio = new ChangeIO({});

//use simple AMQP-style topic patterns to choose changes that a client will see
changeio.qualify('stock.tokyo.*')
changeio.qualify('commodities.nyse.*')

//use a function to setup the patterns
changeio.qualify(function(connection, callback){
	var host = connection.request.host;
	pattern = host + '.private.stock';
	return cb(null, host);
});

//listen on the port
changeio.io.listen(5000);

...
//push a change to the connected clients. Change io will match the qualifier to connection patterns
changeio.push('stock.nyse.google', {'update':{price: 560034.233}});
```
### With socket.io on the client
```
var client = io.connect('http://localhost:5000/changeio', {path:'/changeio/resources'});
client.on('change', function(topic, change){
	//put code to adopt changes here
});

```

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## History

TODO: Write history

## Credits

Adedayo Omitayo 
	- https://github.com/Aomitayo

## License

[MIT](LICENSE)