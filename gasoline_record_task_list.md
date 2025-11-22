# ガソリン給油記録アプリ 開発タスク一覧

## プロジェクト情報
- **プロジェクト名**: ガソリン給油記録アプリ
- **技術スタック**: Vue.js + Supabase
- **開発形態**: 個人プロジェクト

---

## Phase 1: MVP開発

### 1. 環境構築（優先度: 最高）

#### 1.1 プロジェクトセットアップ
- [ ] Node.js / npm のインストール確認
- [ ] Vue.jsプロジェクトの作成
  ```bash
  npm create vue@latest gasoline-record-app
  # TypeScript: Yes/No (お好みで)
  # Router: Yes
  # Pinia: Yes (状態管理用)
  ```
- [ ] 開発用ローカルサーバーの起動確認
- [ ] Git リポジトリの初期化

#### 1.2 Supabaseセットアップ
- [ ] Supabaseアカウント作成
- [ ] 新規プロジェクト作成
- [ ] プロジェクトURLとAPIキーの取得
- [ ] Supabase JavaScriptクライアントのインストール
  ```bash
  npm install @supabase/supabase-js
  ```
- [ ] Supabaseクライアントの初期化ファイル作成（`src/lib/supabase.js`）

#### 1.3 UIライブラリ・CSS導入（オプション）
- [ ] UIフレームワークの選定と導入
  - 推奨: Vuetify / PrimeVue / Element Plus など
  - または Tailwind CSS でカスタムUI構築
- [ ] 基本的なレイアウトコンポーネントの作成

---

### 2. Supabaseデータベース設定（優先度: 最高）

#### 2.1 テーブル作成

**vehicles テーブル**
```sql
-- vehicles テーブル作成
CREATE TABLE vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  license_plate TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- インデックス作成
CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);

-- updated_at自動更新用トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**fuel_records テーブル**
```sql
-- fuel_records テーブル作成
CREATE TABLE fuel_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  fuel_amount DECIMAL(10,2) NOT NULL CHECK (fuel_amount > 0),
  price_per_liter DECIMAL(10,2) NOT NULL CHECK (price_per_liter > 0),
  odometer INTEGER NOT NULL CHECK (odometer >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- インデックス作成
CREATE INDEX idx_fuel_records_vehicle_id ON fuel_records(vehicle_id);
CREATE INDEX idx_fuel_records_date ON fuel_records(date DESC);

-- updated_at自動更新用トリガー
CREATE TRIGGER update_fuel_records_updated_at
  BEFORE UPDATE ON fuel_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### 2.2 Row Level Security (RLS) ポリシー設定

**vehicles テーブルのRLS**
```sql
-- RLSを有効化
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の車両のみ閲覧可能
CREATE POLICY "Users can view own vehicles"
  ON vehicles FOR SELECT
  USING (auth.uid() = user_id);

-- ユーザーは自分の車両のみ作成可能
CREATE POLICY "Users can create own vehicles"
  ON vehicles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分の車両のみ更新可能
CREATE POLICY "Users can update own vehicles"
  ON vehicles FOR UPDATE
  USING (auth.uid() = user_id);

-- ユーザーは自分の車両のみ削除可能
CREATE POLICY "Users can delete own vehicles"
  ON vehicles FOR DELETE
  USING (auth.uid() = user_id);
```

**fuel_records テーブルのRLS**
```sql
-- RLSを有効化
ALTER TABLE fuel_records ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の車両の給油記録のみ閲覧可能
CREATE POLICY "Users can view own fuel records"
  ON fuel_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = fuel_records.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

-- ユーザーは自分の車両の給油記録のみ作成可能
CREATE POLICY "Users can create own fuel records"
  ON fuel_records FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = fuel_records.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

-- ユーザーは自分の車両の給油記録のみ更新可能
CREATE POLICY "Users can update own fuel records"
  ON fuel_records FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = fuel_records.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

-- ユーザーは自分の車両の給油記録のみ削除可能
CREATE POLICY "Users can delete own fuel records"
  ON fuel_records FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = fuel_records.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );
```

#### 2.3 Supabase Auth設定
- [ ] Email認証の有効化（Supabase Dashboard > Authentication > Providers）
- [ ] メール確認の設定（必要に応じて無効化も可能）
- [ ] サイトURLの設定（リダイレクト用）

---

### 3. 認証機能実装（優先度: 高）

#### 3.1 認証関連コンポーネント
- [ ] ログイン画面コンポーネント作成（`LoginView.vue`）
  - メールアドレス入力フィールド
  - パスワード入力フィールド
  - ログインボタン
  - 新規登録画面へのリンク
  - エラーメッセージ表示
  
- [ ] 新規登録画面コンポーネント作成（`RegisterView.vue`）
  - メールアドレス入力フィールド
  - パスワード入力フィールド
  - パスワード確認フィールド
  - 登録ボタン
  - ログイン画面へのリンク
  - エラーメッセージ表示

#### 3.2 認証ロジック実装
- [ ] ログイン処理の実装
  ```javascript
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  })
  ```
- [ ] 新規登録処理の実装
  ```javascript
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password
  })
  ```
- [ ] ログアウト処理の実装
  ```javascript
  const { error } = await supabase.auth.signOut()
  ```
- [ ] 認証状態の管理（Pinia Storeで管理）
  ```javascript
  supabase.auth.onAuthStateChange((event, session) => {
    // セッション状態の更新
  })
  ```

#### 3.3 ルーティング保護
- [ ] ルートガードの実装
  - 未認証ユーザーはログイン画面へリダイレクト
  - 認証済みユーザーはメイン画面へリダイレクト

---

### 4. 車両管理機能実装（優先度: 高）

#### 4.1 車両一覧画面
- [ ] 車両一覧画面コンポーネント作成（`VehicleListView.vue`）
  - 車両リスト表示（カードまたはリスト形式）
  - 各車両に編集・削除ボタン
  - 新規車両登録ボタン
  - 空状態の表示（車両が0台の場合）

- [ ] 車両データ取得処理
  ```javascript
  const { data: vehicles, error } = await supabase
    .from('vehicles')
    .select('*')
    .order('created_at', { ascending: false })
  ```

#### 4.2 車両登録画面
- [ ] 車両登録画面コンポーネント作成（`VehicleCreateView.vue`）
  - 車名入力フィールド
  - ナンバー入力フィールド
  - 登録ボタン
  - キャンセルボタン
  - バリデーション処理

- [ ] 車両登録処理
  ```javascript
  const { data, error } = await supabase
    .from('vehicles')
    .insert({
      user_id: user.id,
      name: vehicleName,
      license_plate: licensePlate
    })
  ```

#### 4.3 車両編集画面
- [ ] 車両編集画面コンポーネント作成（`VehicleEditView.vue`）
  - 既存データの読み込み
  - 車名入力フィールド
  - ナンバー入力フィールド
  - 更新ボタン
  - キャンセルボタン
  - バリデーション処理

- [ ] 車両更新処理
  ```javascript
  const { data, error } = await supabase
    .from('vehicles')
    .update({
      name: vehicleName,
      license_plate: licensePlate
    })
    .eq('id', vehicleId)
  ```

#### 4.4 車両削除機能
- [ ] 削除確認ダイアログの実装
- [ ] 車両削除処理（関連する給油記録も自動削除される）
  ```javascript
  const { error } = await supabase
    .from('vehicles')
    .delete()
    .eq('id', vehicleId)
  ```

---

### 5. 給油記録管理機能実装（優先度: 最高）

#### 5.1 給油履歴一覧画面
- [ ] 給油履歴一覧画面コンポーネント作成（`FuelRecordListView.vue`）
  - 車両選択ドロップダウン（全車両表示）
  - データテーブル表示
    - 日付
    - 車両名
    - 給油量(L)
    - リッター単価(円/L)
    - 給油金額（計算）
    - 走行距離(km)
    - 前回からの走行距離（計算）
    - 燃費(km/L)（計算）
    - 編集・削除ボタン
  - 新規記録登録ボタン
  - 空状態の表示

- [ ] 給油記録データ取得処理
  ```javascript
  const { data: records, error } = await supabase
    .from('fuel_records')
    .select(`
      *,
      vehicles (
        name,
        license_plate
      )
    `)
    .eq('vehicle_id', selectedVehicleId)
    .order('date', { ascending: false })
  ```

- [ ] 燃費・走行距離計算ロジック実装
  ```javascript
  // 前回の記録を取得して計算
  const calculateFuelEfficiency = (currentRecord, previousRecord) => {
    if (!previousRecord) return null
    const distance = currentRecord.odometer - previousRecord.odometer
    const efficiency = distance / currentRecord.fuel_amount
    return {
      distance,
      efficiency: efficiency.toFixed(2)
    }
  }
  ```

#### 5.2 給油記録登録画面
- [ ] 給油記録登録画面コンポーネント作成（`FuelRecordCreateView.vue`）
  - 車両選択ドロップダウン
  - 日付選択（デフォルト: 今日）
  - 給油量入力（数値、単位: L）
  - リッター単価入力（数値、単位: 円/L）
  - 走行距離入力（数値、単位: km）
  - 給油金額の自動計算表示
  - 登録ボタン
  - キャンセルボタン
  - バリデーション処理
    - 必須入力チェック
    - 数値の妥当性チェック（正の数）
    - 走行距離が前回より大きいかチェック

- [ ] 給油記録登録処理
  ```javascript
  const { data, error } = await supabase
    .from('fuel_records')
    .insert({
      vehicle_id: vehicleId,
      date: date,
      fuel_amount: fuelAmount,
      price_per_liter: pricePerLiter,
      odometer: odometer
    })
  ```

#### 5.3 給油記録編集画面
- [ ] 給油記録編集画面コンポーネント作成（`FuelRecordEditView.vue`）
  - 既存データの読み込み
  - 車両選択ドロップダウン
  - 日付選択
  - 給油量入力
  - リッター単価入力
  - 走行距離入力
  - 給油金額の自動計算表示
  - 更新ボタン
  - キャンセルボタン
  - バリデーション処理

- [ ] 給油記録更新処理
  ```javascript
  const { data, error } = await supabase
    .from('fuel_records')
    .update({
      vehicle_id: vehicleId,
      date: date,
      fuel_amount: fuelAmount,
      price_per_liter: pricePerLiter,
      odometer: odometer
    })
    .eq('id', recordId)
  ```

#### 5.4 給油記録削除機能
- [ ] 削除確認ダイアログの実装
- [ ] 給油記録削除処理
  ```javascript
  const { error } = await supabase
    .from('fuel_records')
    .delete()
    .eq('id', recordId)
  ```

---

### 6. UI/UX調整（優先度: 中）

#### 6.1 レスポンシブデザイン対応
- [ ] スマホ画面での表示確認（375px〜）
- [ ] タブレット画面での表示確認（768px〜）
- [ ] PC画面での表示確認（1024px〜）
- [ ] 横画面表示の確認

#### 6.2 シニア世代向けUI調整
- [ ] フォントサイズの調整（最低16px以上）
- [ ] ボタンサイズの調整（タップしやすいサイズ）
- [ ] コントラストの確認（WCAG AA基準）
- [ ] 入力フィールドのラベル明確化
- [ ] エラーメッセージの分かりやすさ確認

#### 6.3 ユーザビリティ改善
- [ ] ローディング状態の表示
- [ ] 成功・エラーメッセージのトースト表示
- [ ] 確認ダイアログの実装
- [ ] 空状態の適切な表示
- [ ] フォームのオートフォーカス設定

#### 6.4 ナビゲーション
- [ ] ヘッダーメニューの実装
  - ロゴ/アプリ名
  - ナビゲーションリンク
  - ログアウトボタン
- [ ] モバイル用ハンバーガーメニュー
- [ ] パンくずリスト（必要に応じて）

---

### 7. テスト・デバッグ（優先度: 中）

#### 7.1 機能テスト
- [ ] 認証フローの動作確認
  - 新規登録
  - ログイン
  - ログアウト
  - セッション永続化
- [ ] 車両管理の動作確認
  - 登録・編集・削除
  - バリデーション
- [ ] 給油記録管理の動作確認
  - 登録・編集・削除
  - 計算ロジック
  - バリデーション
- [ ] データ整合性の確認
  - 車両削除時の給油記録連動削除
  - 複数車両間のデータ分離

#### 7.2 ブラウザ互換性テスト
- [ ] Chrome（最新版）
- [ ] Safari（iOS含む）
- [ ] Edge（最新版）

#### 7.3 パフォーマンステスト
- [ ] 初回ロード時間の測定
- [ ] データ取得・登録の応答時間確認
- [ ] 大量データ（100件以上）での動作確認

---

### 8. デプロイ準備（優先度: 中）

#### 8.1 本番環境設定
- [ ] 環境変数の設定（`.env.production`）
  - Supabase URL
  - Supabase Anon Key
- [ ] ビルド設定の確認
  ```bash
  npm run build
  ```

#### 8.2 ホスティング
- [ ] ホスティングサービスの選定
  - 推奨: Vercel / Netlify / Cloudflare Pages
- [ ] デプロイ設定
- [ ] カスタムドメイン設定（必要に応じて）
- [ ] SSL証明書の確認

#### 8.3 本番環境テスト
- [ ] 本番環境での動作確認
- [ ] モバイル実機でのテスト
- [ ] パフォーマンス確認

---

## Phase 2: 拡張機能（将来実装）

### 9. 統計・分析機能
- [ ] 月別給油金額集計
- [ ] 平均燃費の計算・表示
- [ ] 給油金額のグラフ表示（Chart.js等）
- [ ] 燃費推移のグラフ表示
- [ ] 期間指定フィルター機能

### 10. その他機能
- [ ] レシート写真アップロード機能
- [ ] データエクスポート機能（CSV）
- [ ] データインポート機能（既存データの移行）
- [ ] 複数ユーザー間でのデータ共有
- [ ] リマインダー機能（次回給油目安）

---

## 開発スケジュール目安（参考）

| フェーズ | タスク | 想定工数 |
|---------|-------|---------|
| 1 | 環境構築 | 1日 |
| 2 | Supabaseデータベース設定 | 0.5日 |
| 3 | 認証機能実装 | 2日 |
| 4 | 車両管理機能実装 | 2-3日 |
| 5 | 給油記録管理機能実装 | 3-4日 |
| 6 | UI/UX調整 | 2-3日 |
| 7 | テスト・デバッグ | 1-2日 |
| 8 | デプロイ準備 | 0.5-1日 |
| **合計** | **Phase 1 完了** | **12-17日** |

※実際の工数は開発者のスキルや作業時間により変動します

---

## チェックリスト：MVP完成の条件

- [ ] ユーザー登録・ログインができる
- [ ] 車両の登録・編集・削除ができる
- [ ] 給油記録の登録・編集・削除ができる
- [ ] 給油履歴が一覧で見られる
- [ ] 燃費と走行距離が自動計算される
- [ ] スマホで快適に使える
- [ ] 親が問題なく使える（ユーザビリティテスト）
- [ ] 本番環境にデプロイされている

---

## トラブルシューティング

### よくある問題と解決方法

**問題: Supabaseに接続できない**
- 環境変数が正しく設定されているか確認
- SupabaseのプロジェクトURLとAPIキーが正しいか確認
- RLSポリシーが正しく設定されているか確認

**問題: データが取得できない**
- RLSポリシーを確認
- ユーザーが正しく認証されているか確認
- テーブルのリレーションが正しいか確認

**問題: 認証がうまく動かない**
- Supabase Authの設定を確認
- メール確認が必要な設定になっていないか確認
- セッション管理が正しく実装されているか確認

---

## 参考リソース

- [Vue.js 公式ドキュメント](https://ja.vuejs.org/)
- [Supabase 公式ドキュメント](https://supabase.com/docs)
- [Supabase Vue.js クイックスタート](https://supabase.com/docs/guides/getting-started/quickstarts/vue)
- [Vue Router 公式ドキュメント](https://router.vuejs.org/)
- [Pinia 公式ドキュメント](https://pinia.vuejs.org/)
