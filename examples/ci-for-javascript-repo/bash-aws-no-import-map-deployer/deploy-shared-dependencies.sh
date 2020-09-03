curl -L https://github.com/stedolan/jq/releases/download/jq-1.6/jq-linux64 -o ./jq
chmod a+x ./jq

# Download the live import map
aws s3 cp s3://bucket-name/live.importmap live.importmap || echo '{"imports": {}}' > live.importmap

echo "Import Map before deployment:"
cat ./live.importmap

cat ./shared.importmap
sed -i 's/$ASSET_CDN/https:\/\/cdn.example.com/g' shared.importmap
echo "Import Map being merged in:"
cat ./shared.importmap

# Modify the import map
./jq -s '.[0] * .[1]' live.importmap shared.importmap > new.importmap

echo "Import Map after deployment"
cat new.importmap

# Upload
aws s3 cp --content-type application/importmap+json --cache-control 'public, must-revalidate, max-age=10;' live.importmap s3://bucket-name/live.importmap