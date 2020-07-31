# See https://github.com/thawkin3/single-spa-demo-root-config/blob/master/after_deploy.sh

echo "Downloading import map from S3"
aws s3 cp s3://$BUCKET_NAME/$ORG_NAME/importmap.json importmap.json
echo "Updating import map to point to new version of $ORG_NAME/$PROJECT_NAME"
node update-importmap.mjs
echo "Uploading new import map to S3"
aws s3 cp importmap.json s3://$BUCKET_NAME/$ORG_NAME/importmap.json --cache-control 'public, must-revalidate, max-age=0' --acl 'public-read'
echo "Deployment successful"
