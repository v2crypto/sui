
import { SocksProxyAgent } from 'socks-proxy-agent';

require('isomorphic-fetch');

fetch('https://api3.binance.com/sapi/v1/system/status', {
    agent: new SocksProxyAgent("socks://127.0.0.1:7890"),
} as any ).then(function(response) {
		if (response.status >= 400) {
			throw new Error("Bad response from server");
		}
		return response.json();
	})
	.then(function(stories) {
		console.log(stories);
	});