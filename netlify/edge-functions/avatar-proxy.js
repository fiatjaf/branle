export default request => {
  let url = new URL(request.url)
  let proxyUrl = url.searchParams.get('url')
  let proxyRequest = new Request(proxyUrl, {method: 'GET'})
  return fetch(proxyRequest)
}
