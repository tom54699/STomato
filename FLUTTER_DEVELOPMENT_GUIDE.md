# Tomato Flutter App 開發指南

## 專案概述

本文檔提供 Tomato Flutter App 的完整開發指南，包括後端 API 接口說明、資料模型、開發建議等。

**React 前端角色**：模擬/原型展示
**Flutter App 角色**：生產環境應用，真實連接後端 API

---

## 目錄

- [快速開始](#快速開始)
- [後端 API 總覽](#後端-api-總覽)
- [資料模型](#資料模型)
- [API 接口詳細說明](#api-接口詳細說明)
- [Flutter 開發建議](#flutter-開發建議)
- [錯誤處理](#錯誤處理)
- [測試建議](#測試建議)

---

## 快速開始

### 1. 啟動後端服務

```bash
cd tomato-backend

# 確保 PostgreSQL 正在運行
brew services start postgresql@15

# 創建資料庫（第一次）
psql -U postgres -c "CREATE DATABASE tomato_db;"

# 配置環境變數
cp .env.example .env
# 編輯 .env 設置資料庫密碼和 JWT 密鑰

# 啟動後端
go run cmd/server/main.go
```

後端 API 基礎 URL：`http://localhost:8080`

### 2. 測試 API

```bash
# 健康檢查
curl http://localhost:8080/health

# 註冊測試用戶
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "測試用戶",
    "school_name": "台灣大學"
  }'
```

---

## 後端 API 總覽

### 基礎資訊

- **Base URL**: `http://localhost:8080` (開發) / `https://api.yourdomain.com` (生產)
- **API Version**: v1
- **認證方式**: JWT Bearer Token
- **資料格式**: JSON
- **字符編碼**: UTF-8

### API 端點清單

#### 1. 認證 API
- `POST /api/v1/auth/register` - 用戶註冊
- `POST /api/v1/auth/login` - 用戶登入
- `POST /api/v1/auth/refresh` - 刷新 Token
- `POST /api/v1/auth/logout` - 登出

#### 2. 課程管理 API
- `GET /api/v1/courses` - 獲取課程列表
- `POST /api/v1/courses` - 創建課程
- `GET /api/v1/courses/:id` - 獲取課程詳情
- `PUT /api/v1/courses/:id` - 更新課程
- `DELETE /api/v1/courses/:id` - 刪除課程

#### 3. 學習計畫 API
- `GET /api/v1/plans` - 獲取計畫列表
- `POST /api/v1/plans` - 創建計畫
- `GET /api/v1/plans/:id` - 獲取計畫詳情
- `PUT /api/v1/plans/:id` - 更新計畫
- `DELETE /api/v1/plans/:id` - 刪除計畫
- `PATCH /api/v1/plans/:id/complete` - 切換完成狀態

#### 4. 專注紀錄 API
- `GET /api/v1/sessions` - 獲取專注紀錄列表
- `POST /api/v1/sessions` - 創建專注紀錄
- `GET /api/v1/sessions/stats` - 獲取統計數據

#### 5. 待辦事項 API
- `GET /api/v1/todos` - 獲取待辦列表
- `POST /api/v1/todos` - 創建待辦
- `GET /api/v1/todos/:id` - 獲取待辦詳情
- `PUT /api/v1/todos/:id` - 更新待辦
- `DELETE /api/v1/todos/:id` - 刪除待辦
- `PATCH /api/v1/todos/:id/complete` - 切換完成狀態

---

## 資料模型

### 統一回應格式

所有 API 回應都使用統一格式：

```json
// 成功
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}

// 失敗
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "錯誤訊息",
    "details": { ... }
  }
}
```

### 用戶 (User)

```dart
class User {
  String id;              // UUID
  String email;
  String name;
  String? schoolId;       // UUID (可選)
  School? school;         // 關聯的學校
  int totalPoints;
  DateTime createdAt;
  DateTime updatedAt;
}
```

### 學校 (School)

```dart
class School {
  String id;              // UUID
  String name;
  int totalPoints;
  DateTime createdAt;
  DateTime updatedAt;
}
```

### 課程 (Course)

```dart
class Course {
  String id;              // UUID
  String userId;          // UUID
  String name;
  String color;           // Hex color code
  int credits;
  DateTime startDate;
  DateTime endDate;
  int dayOfWeek;          // 0-6 (日-六)
  String startTime;       // "HH:mm" 格式
  String endTime;         // "HH:mm" 格式
  String? location;
  String? professorName;
  DateTime createdAt;
  DateTime updatedAt;
}
```

### 學習計畫 (StudyPlan)

```dart
class StudyPlan {
  String id;              // UUID
  String userId;          // UUID
  String? courseId;       // UUID (可選)
  Course? course;         // 關聯的課程
  String title;
  DateTime date;
  String? startTime;      // "HH:mm" 格式
  int targetMinutes;
  int completedMinutes;
  int pomodoroCount;
  bool completed;
  String? location;
  String? notes;
  DateTime createdAt;
  DateTime updatedAt;
}
```

### 專注紀錄 (FocusSession)

```dart
class FocusSession {
  String id;              // UUID
  String userId;          // UUID
  String? planId;         // UUID (可選)
  StudyPlan? plan;        // 關聯的計畫
  String? courseId;       // UUID (可選)
  Course? course;         // 關聯的課程
  DateTime date;
  int minutes;
  int pointsEarned;
  String? location;
  DateTime createdAt;
}
```

### 待辦事項 (Todo)

```dart
enum TodoType { homework, exam, memo }

class Todo {
  String id;              // UUID
  String userId;          // UUID
  String? courseId;       // UUID (可選)
  Course? course;         // 關聯的課程
  String title;
  DateTime date;
  TodoType todoType;
  bool completed;
  DateTime createdAt;
  DateTime updatedAt;
}
```

---

## API 接口詳細說明

### 1. 認證 API

#### 1.1 用戶註冊

```
POST /api/v1/auth/register
```

**請求體**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "張三",
  "school_name": "台灣大學"
}
```

**回應**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "張三",
      "school": {
        "id": "uuid",
        "name": "台灣大學",
        "total_points": 0
      },
      "total_points": 0,
      "created_at": "2025-12-10T10:00:00Z"
    },
    "access_token": "eyJhbGci...",
    "refresh_token": "eyJhbGci..."
  },
  "message": "註冊成功"
}
```

**Dart 示例**:
```dart
Future<AuthResponse> register({
  required String email,
  required String password,
  required String name,
  required String schoolName,
}) async {
  final response = await http.post(
    Uri.parse('$baseUrl/api/v1/auth/register'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'email': email,
      'password': password,
      'name': name,
      'school_name': schoolName,
    }),
  );

  if (response.statusCode == 201) {
    final data = jsonDecode(response.body);
    return AuthResponse.fromJson(data['data']);
  } else {
    throw Exception('註冊失敗');
  }
}
```

#### 1.2 用戶登入

```
POST /api/v1/auth/login
```

**請求體**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**回應**: 與註冊相同格式

**Dart 示例**:
```dart
Future<AuthResponse> login({
  required String email,
  required String password,
}) async {
  final response = await http.post(
    Uri.parse('$baseUrl/api/v1/auth/login'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'email': email,
      'password': password,
    }),
  );

  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    return AuthResponse.fromJson(data['data']);
  } else {
    throw Exception('登入失敗');
  }
}
```

#### 1.3 刷新 Token

```
POST /api/v1/auth/refresh
```

**請求體**:
```json
{
  "refresh_token": "eyJhbGci..."
}
```

**回應**: 返回新的 access_token 和 refresh_token

#### 1.4 登出

```
POST /api/v1/auth/logout
```

**Headers**: 需要 `Authorization: Bearer <access_token>`

---

### 2. 課程管理 API

#### 2.1 獲取課程列表

```
GET /api/v1/courses
```

**Headers**: 需要認證

**回應**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "計算機概論",
      "color": "#3b82f6",
      "credits": 3,
      "start_date": "2024-09-01",
      "end_date": "2025-01-15",
      "day_of_week": 1,
      "start_time": "09:00",
      "end_time": "11:00",
      "location": "理學院101",
      "professor_name": "王教授",
      "created_at": "2025-12-10T10:00:00Z",
      "updated_at": "2025-12-10T10:00:00Z"
    }
  ]
}
```

**Dart 示例**:
```dart
Future<List<Course>> getCourses() async {
  final response = await http.get(
    Uri.parse('$baseUrl/api/v1/courses'),
    headers: {
      'Authorization': 'Bearer $accessToken',
    },
  );

  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    return (data['data'] as List)
        .map((json) => Course.fromJson(json))
        .toList();
  } else {
    throw Exception('獲取課程失敗');
  }
}
```

#### 2.2 創建課程

```
POST /api/v1/courses
```

**Headers**: 需要認證

**請求體**:
```json
{
  "name": "計算機概論",
  "color": "#3b82f6",
  "credits": 3,
  "start_date": "2024-09-01",
  "end_date": "2025-01-15",
  "day_of_week": 1,
  "start_time": "09:00",
  "end_time": "11:00",
  "location": "理學院101",
  "professor_name": "王教授"
}
```

**回應**: 返回創建的課程對象

---

### 3. 學習計畫 API

#### 3.1 獲取計畫列表

```
GET /api/v1/plans?date=2025-12-10&completed=false
```

**Headers**: 需要認證

**查詢參數**:
- `date` (可選): 篩選特定日期的計畫 (YYYY-MM-DD)
- `start_date` (可選): 開始日期
- `end_date` (可選): 結束日期
- `completed` (可選): 篩選完成狀態 (true/false)

**回應**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "course_id": "uuid",
      "course": { ... },
      "title": "期中考複習",
      "date": "2025-12-10",
      "start_time": "14:00",
      "target_minutes": 120,
      "completed_minutes": 50,
      "pomodoro_count": 2,
      "completed": false,
      "location": "圖書館",
      "notes": "重點複習第三章",
      "created_at": "2025-12-10T10:00:00Z",
      "updated_at": "2025-12-10T15:00:00Z"
    }
  ]
}
```

**Dart 示例**:
```dart
Future<List<StudyPlan>> getPlans({
  String? date,
  bool? completed,
}) async {
  final queryParams = <String, String>{};
  if (date != null) queryParams['date'] = date;
  if (completed != null) queryParams['completed'] = completed.toString();

  final uri = Uri.parse('$baseUrl/api/v1/plans')
      .replace(queryParameters: queryParams);

  final response = await http.get(
    uri,
    headers: {'Authorization': 'Bearer $accessToken'},
  );

  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    return (data['data'] as List)
        .map((json) => StudyPlan.fromJson(json))
        .toList();
  } else {
    throw Exception('獲取計畫失敗');
  }
}
```

#### 3.2 創建計畫

```
POST /api/v1/plans
```

**Headers**: 需要認證

**請求體**:
```json
{
  "title": "期中考複習",
  "course_id": "uuid",
  "date": "2025-12-10",
  "start_time": "14:00",
  "target_minutes": 120,
  "location": "圖書館",
  "notes": "重點複習第三章"
}
```

#### 3.3 切換完成狀態

```
PATCH /api/v1/plans/:id/complete
```

**Headers**: 需要認證

**請求體**:
```json
{
  "completed": true
}
```

---

### 4. 專注紀錄 API

#### 4.1 創建專注紀錄

```
POST /api/v1/sessions
```

**Headers**: 需要認證

**請求體**:
```json
{
  "plan_id": "uuid",
  "course_id": "uuid",
  "date": "2025-12-10",
  "minutes": 25,
  "location": "圖書館"
}
```

**回應**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "plan_id": "uuid",
    "course_id": "uuid",
    "date": "2025-12-10",
    "minutes": 25,
    "points_earned": 250,
    "location": "圖書館",
    "created_at": "2025-12-10T15:30:00Z"
  },
  "message": "專注紀錄新增成功"
}
```

**重要**: 創建專注紀錄時，後端會自動：
- 計算並獎勵積分
- 更新用戶總積分
- 更新學校總積分
- 更新關聯計畫的進度
- 自動標記計畫為完成（如果達到目標）

**Dart 示例**:
```dart
Future<FocusSession> createSession({
  String? planId,
  String? courseId,
  required String date,
  required int minutes,
  String? location,
}) async {
  final response = await http.post(
    Uri.parse('$baseUrl/api/v1/sessions'),
    headers: {
      'Authorization': 'Bearer $accessToken',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({
      'plan_id': planId,
      'course_id': courseId,
      'date': date,
      'minutes': minutes,
      'location': location,
    }),
  );

  if (response.statusCode == 201) {
    final data = jsonDecode(response.body);
    return FocusSession.fromJson(data['data']);
  } else {
    throw Exception('創建紀錄失敗');
  }
}
```

#### 4.2 獲取統計數據

```
GET /api/v1/sessions/stats?period=week
```

**Headers**: 需要認證

**查詢參數**:
- `period` (可選): week, month, year, lifetime (預設: month)

**回應**:
```json
{
  "success": true,
  "data": {
    "period": "week",
    "total_sessions": 15,
    "total_minutes": 375,
    "total_points": 3750,
    "active_days": 5,
    "current_streak": 3,
    "daily_breakdown": [
      {
        "date": "2025-12-10",
        "sessions": 3,
        "minutes": 75,
        "points": 750
      }
    ],
    "course_breakdown": [
      {
        "course_name": "計算機概論",
        "minutes": 150,
        "percentage": 40
      }
    ]
  }
}
```

---

### 5. 待辦事項 API

#### 5.1 獲取待辦列表

```
GET /api/v1/todos?date=2025-12-10&type=homework&completed=false
```

**Headers**: 需要認證

**查詢參數**:
- `date` (可選): 篩選特定日期
- `type` (可選): homework, exam, memo
- `completed` (可選): true/false

**回應**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "course_id": "uuid",
      "course": { ... },
      "title": "數學作業",
      "date": "2025-12-10",
      "todo_type": "homework",
      "completed": false,
      "created_at": "2025-12-10T10:00:00Z",
      "updated_at": "2025-12-10T10:00:00Z"
    }
  ]
}
```

#### 5.2 創建待辦

```
POST /api/v1/todos
```

**Headers**: 需要認證

**請求體**:
```json
{
  "title": "數學作業",
  "course_id": "uuid",
  "date": "2025-12-10",
  "todo_type": "homework"
}
```

---

## Flutter 開發建議

### 1. 專案結構

```
lib/
├── main.dart
├── models/
│   ├── user.dart
│   ├── course.dart
│   ├── study_plan.dart
│   ├── focus_session.dart
│   └── todo.dart
├── services/
│   ├── api_client.dart
│   ├── auth_service.dart
│   ├── course_service.dart
│   ├── plan_service.dart
│   ├── session_service.dart
│   └── todo_service.dart
├── providers/
│   ├── auth_provider.dart
│   ├── course_provider.dart
│   └── ...
├── screens/
│   ├── auth/
│   ├── home/
│   ├── schedule/
│   ├── planner/
│   └── insights/
└── widgets/
    ├── common/
    └── custom/
```

### 2. 推薦套件

```yaml
dependencies:
  flutter:
    sdk: flutter

  # 狀態管理
  provider: ^6.1.1
  # 或 riverpod: ^2.4.9

  # 網路請求
  http: ^1.1.2
  dio: ^5.4.0

  # 本地存儲
  shared_preferences: ^2.2.2
  flutter_secure_storage: ^9.0.0

  # JSON 序列化
  json_annotation: ^4.8.1

  # 路由
  go_router: ^13.0.0

  # UI
  flutter_svg: ^2.0.9
  intl: ^0.18.1

dev_dependencies:
  build_runner: ^2.4.7
  json_serializable: ^6.7.1
```

### 3. API Client 實作建議

```dart
class ApiClient {
  final String baseUrl;
  final Dio _dio;

  ApiClient(this.baseUrl) : _dio = Dio(BaseOptions(
    baseUrl: baseUrl,
    connectTimeout: const Duration(seconds: 30),
    receiveTimeout: const Duration(seconds: 30),
  )) {
    _dio.interceptors.add(AuthInterceptor());
    _dio.interceptors.add(ErrorInterceptor());
  }

  Future<T> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) async {
    try {
      final response = await _dio.get(path, queryParameters: queryParameters);
      return _handleResponse<T>(response);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // post, put, patch, delete 方法...
}
```

### 4. 認證攔截器

```dart
class AuthInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final token = await _storage.read(key: 'access_token');
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      // Token 過期，嘗試刷新
      if (await _refreshToken()) {
        // 重試原請求
        return handler.resolve(await _retry(err.requestOptions));
      }
    }
    handler.next(err);
  }
}
```

### 5. Model 實作建議

使用 `json_serializable` 自動生成 JSON 序列化代碼：

```dart
import 'package:json_annotation/json_annotation.dart';

part 'user.g.dart';

@JsonSerializable()
class User {
  final String id;
  final String email;
  final String name;
  @JsonKey(name: 'school_id')
  final String? schoolId;
  final School? school;
  @JsonKey(name: 'total_points')
  final int totalPoints;
  @JsonKey(name: 'created_at')
  final DateTime createdAt;
  @JsonKey(name: 'updated_at')
  final DateTime updatedAt;

  User({
    required this.id,
    required this.email,
    required this.name,
    this.schoolId,
    this.school,
    required this.totalPoints,
    required this.createdAt,
    required this.updatedAt,
  });

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
  Map<String, dynamic> toJson() => _$UserToJson(this);
}
```

---

## 錯誤處理

### 錯誤碼對照表

| HTTP 狀態碼 | 錯誤碼 | 說明 | 處理建議 |
|-----------|-------|------|---------|
| 400 | VALIDATION_ERROR | 參數驗證失敗 | 顯示具體錯誤訊息 |
| 401 | UNAUTHORIZED | 未認證或 token 過期 | 刷新 token 或重新登入 |
| 403 | FORBIDDEN | 無權限 | 提示用戶無權限 |
| 404 | NOT_FOUND | 資源不存在 | 提示資源不存在 |
| 409 | CONFLICT | 資源衝突 | 提示用戶修改 |
| 500 | INTERNAL_ERROR | 伺服器錯誤 | 提示稍後再試 |

### Flutter 錯誤處理示例

```dart
try {
  final user = await authService.login(email, password);
  // 處理成功
} on ApiException catch (e) {
  switch (e.code) {
    case 'UNAUTHORIZED':
      showError('帳號或密碼錯誤');
      break;
    case 'VALIDATION_ERROR':
      showError(e.message);
      break;
    default:
      showError('登入失敗，請稍後再試');
  }
} catch (e) {
  showError('網路錯誤');
}
```

---

## 測試建議

### 1. 單元測試

```dart
void main() {
  group('AuthService', () {
    late AuthService authService;
    late MockApiClient mockApiClient;

    setUp(() {
      mockApiClient = MockApiClient();
      authService = AuthService(mockApiClient);
    });

    test('login success', () async {
      when(mockApiClient.post(any, any)).thenAnswer(
        (_) async => ApiResponse(success: true, data: mockAuthData),
      );

      final result = await authService.login('test@example.com', 'password');

      expect(result.user.email, 'test@example.com');
      verify(mockApiClient.post('/api/v1/auth/login', any)).called(1);
    });
  });
}
```

### 2. Widget 測試

```dart
void main() {
  testWidgets('Login form validation', (tester) async {
    await tester.pumpWidget(MaterialApp(home: LoginScreen()));

    // 輸入無效 email
    await tester.enterText(find.byKey(Key('email')), 'invalid');
    await tester.tap(find.byKey(Key('submit')));
    await tester.pump();

    expect(find.text('請輸入有效的 Email'), findsOneWidget);
  });
}
```

---

## 開發檢查清單

### 後端已完成 ✅
- [x] 用戶認證系統
- [x] 課程管理 API
- [x] 學習計畫 API
- [x] 專注紀錄 API
- [x] 待辦事項 API
- [x] 自動積分系統
- [x] 完整測試 (127+ 測試用例)
- [x] API 文檔

### Flutter 開發待完成 ⏳
- [ ] 專案初始化
- [ ] API Client 建立
- [ ] 資料模型定義
- [ ] 認證流程實作
- [ ] 主要功能頁面
- [ ] 狀態管理
- [ ] 本地存儲
- [ ] 錯誤處理
- [ ] 單元測試
- [ ] UI/UX 優化

---

## 參考資源

### 後端文檔
- [API 設計文檔](tomato-backend/docs/api_design.md)
- [資料庫設計](tomato-backend/docs/database_schema.md)
- [測試文檔](tomato-backend/docs/testing.md)
- [快速開始](tomato-backend/QUICKSTART.md)

### Flutter 學習資源
- [Flutter 官方文檔](https://flutter.dev/docs)
- [Dio HTTP Client](https://pub.dev/packages/dio)
- [Provider 狀態管理](https://pub.dev/packages/provider)
- [JSON Serialization](https://flutter.dev/docs/development/data-and-backend/json)

---

**最後更新**: 2025-12-10
**後端版本**: v1.0
**API 狀態**: Production Ready ✅
