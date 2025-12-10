package testutil

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/tomato-backend/internal/utils"
)

// SetupTestRouter creates a test Gin router
func SetupTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	return gin.New()
}

// MakeRequest makes a test HTTP request
func MakeRequest(t *testing.T, router *gin.Engine, method, path string, body interface{}, headers map[string]string) *httptest.ResponseRecorder {
	var reqBody io.Reader
	if body != nil {
		jsonBody, err := json.Marshal(body)
		if err != nil {
			t.Fatalf("Failed to marshal request body: %v", err)
		}
		reqBody = bytes.NewBuffer(jsonBody)
	}

	req, err := http.NewRequest(method, path, reqBody)
	if err != nil {
		t.Fatalf("Failed to create request: %v", err)
	}

	// Set default headers
	req.Header.Set("Content-Type", "application/json")

	// Set custom headers
	for key, value := range headers {
		req.Header.Set(key, value)
	}

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	return w
}

// MakeAuthenticatedRequest makes a request with JWT token
func MakeAuthenticatedRequest(t *testing.T, router *gin.Engine, method, path, token string, body interface{}) *httptest.ResponseRecorder {
	headers := map[string]string{
		"Authorization": "Bearer " + token,
	}
	return MakeRequest(t, router, method, path, body, headers)
}

// ParseResponse parses JSON response into a struct
func ParseResponse(t *testing.T, w *httptest.ResponseRecorder, dest interface{}) {
	if err := json.Unmarshal(w.Body.Bytes(), dest); err != nil {
		t.Fatalf("Failed to parse response: %v. Body: %s", err, w.Body.String())
	}
}

// AssertStatusCode checks if response has expected status code
func AssertStatusCode(t *testing.T, w *httptest.ResponseRecorder, expected int) {
	if w.Code != expected {
		t.Errorf("Expected status code %d, got %d. Body: %s", expected, w.Code, w.Body.String())
	}
}

// AssertSuccess checks if response is successful
func AssertSuccess(t *testing.T, w *httptest.ResponseRecorder) {
	var response utils.Response
	ParseResponse(t, w, &response)
	if !response.Success {
		t.Errorf("Expected success response, got error: %v", response.Error)
	}
}

// AssertError checks if response contains an error
func AssertError(t *testing.T, w *httptest.ResponseRecorder, expectedCode string) {
	var response utils.Response
	ParseResponse(t, w, &response)
	if response.Success {
		t.Errorf("Expected error response, got success")
	}
	if response.Error == nil {
		t.Errorf("Expected error object in response")
	}
	if expectedCode != "" && response.Error.Code != expectedCode {
		t.Errorf("Expected error code %s, got %s", expectedCode, response.Error.Code)
	}
}

// GetResponseData extracts data from successful response
func GetResponseData(t *testing.T, w *httptest.ResponseRecorder) interface{} {
	var response utils.Response
	ParseResponse(t, w, &response)
	return response.Data
}

// GenerateTestToken generates a JWT token for testing
func GenerateTestToken(t *testing.T, userID, email string) string {
	token, err := utils.GenerateToken(userID, email)
	if err != nil {
		t.Fatalf("Failed to generate test token: %v", err)
	}
	return token
}
