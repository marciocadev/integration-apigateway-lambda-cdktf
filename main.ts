import { Construct } from "constructs";
import { App, TerraformStack, CloudBackend, NamedCloudWorkspace } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { CdkTFLambda } from "./src/lambda";
import * as path from "path";

class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new AwsProvider(this, "AWS", {
      region: "us-east-1"
    });

    const lmb = new CdkTFLambda(this, "my-lambda", {
      path: path.resolve(__dirname, "src/lambda/index.ts"),
      name: "my-first-lambda"
    })

  }
}

const app = new App();
const stack = new MyStack(app, "integration-apigateway-lambda-cdktf");
new CloudBackend(stack, {
  hostname: "app.terraform.io",
  organization: "cdktf-teams",
  workspaces: new NamedCloudWorkspace("integration-apigateway-lambda-cdktf")
});
app.synth();
