sacloud-to-terraform
====

さくらのクラウドのリソース情報を取得し、Terraform用のtfファイル（json）を出力するツール。

## Requirements

* Node.js >= 6.0
* [Terraform](https://github.com/hashicorp/terraform)
* [Terraform for さくらのクラウド](https://github.com/sacloud/terraform-provider-sakuracloud)


## Install

```
$ git clone https://github.com/BcRikko/sacloud-to-terraform.git
$ cd sacloud-to-terraform
$ npm install
```

## Build

```
$ npm run build
```

## Start

1. さくらのクラウドで閲覧権限以上のAPIキーをつくる
2. `env.sample.yml`を`env.yml`にリネームする
3. `env.yml`にACCESS TOKEN、ACCESS TOKEN SECRET、デフォルトゾーン（`tk1v`など）を設定する
  * 複数設定可能
  * 実行時に環境変数ACCOUNTを設定することで、APIキーの切り替えが可能。環境変数ACCOUNTが設定されていない場合は、最初にかかれているアカウントを使用する。

```
$ node lib/app.js > sacloud.tf.json
# OR
$ ACCOUNT=your-account node lib/app.js > sacloud.tf.json
```
