package main

import (
	"encoding/base64"
	"io/ioutil"
	"net/http"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

func handler(request events.APIGatewayProxyRequest) (*events.APIGatewayProxyResponse, error) {
	if url, ok := request.QueryStringParameters["url"]; ok {
		resp, err := http.Get(url)
		if err != nil {
			return nil, err
		}

		body, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			return nil, err
		}

		return &events.APIGatewayProxyResponse{
			StatusCode: 200,
			Headers: map[string]string{
				"Content-Type":   resp.Header.Get("Content-Type"),
				"Content-Length": resp.Header.Get("Content-Length"),
			},
			Body:            base64.StdEncoding.EncodeToString(body),
			IsBase64Encoded: true,
		}, nil
	}

	return &events.APIGatewayProxyResponse{
		StatusCode: 200,
		Body:       "",
	}, nil
}

func main() {
	lambda.Start(handler)
}
