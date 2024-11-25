import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamRolePolicyAttachment } from "@cdktf/provider-aws/lib/iam-role-policy-attachment";
import { LambdaFunction } from "@cdktf/provider-aws/lib/lambda-function";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { S3BucketObject } from "@cdktf/provider-aws/lib/s3-bucket-object";
import { AssetType, TerraformAsset } from "cdktf";
import { Construct } from "constructs";

const lambdaRolePolicy = {
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
};

export interface CdkTFLambdaProps {
  path: string;
  name: string;
}

export class CdkTFLambda extends Construct {
  constructor(scope: Construct, id: string, props: CdkTFLambdaProps) {
    super(scope, id);

    /** The TerraformAsset construct helps you manage assets 
      * and expose them to your CDK resources. This code uses 
      * the TerraformAsset to package the compiled handler code
      * into an archive and assigns it to a variable named asset.
      */
    const asset = new TerraformAsset(this, 'lambda-asset', {
      path: props.path,
      type: AssetType.ARCHIVE, // if left empty it infers directory and file
    })

    // Create unique S3 bucket that hosts Lambda executable
    const bucket = new S3Bucket(this, 'bucket', {
      bucketPrefix: `learn-cdktf-${props.name}`,
    })

    // Upload Lambda zip file to newly created S3 bucket
    const lambdaArchive = new S3BucketObject(this, 'lambda-archive', {
      bucket: bucket.bucket,
      key: `${asset.fileName}`,
      source: asset.path, // returns a posix path
    })

    // Create Lambda role
    const role = new IamRole(this, 'lambda-exec', {
      name: `learn-cdktf-${props.name}`,
      assumeRolePolicy: JSON.stringify(lambdaRolePolicy),
    })

    // Add execution role for lambda to write to CloudWatch logs
    new IamRolePolicyAttachment(this, 'lambda-managed-policy', {
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      role: role.name,
    })

    // Create Lambda function
    const lambdaFunc = new LambdaFunction(this, 'learn-cdktf-lambda', {
      functionName: `learn-cdktf-${props.name}`,
      s3Bucket: bucket.bucket,
      s3Key: lambdaArchive.key,
      handler: "index.handler",
      runtime: "nodejs20.x",
      role: role.arn,
    })
  }
}