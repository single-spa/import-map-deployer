mostRecentTag=$(git describe --abbrev=0)
mostRecentCommitMsg=$(git show -s --format=%s)

echo "most recent annotated git tag:"
echo $mostRecentTag;
echo "most recent git commit message:"
echo $mostRecentCommitMsg;

if [[ "$mostRecentTag" = "$mostRecentCommitMsg" ]] then
  echo "Building docker image"
  docker build .
  echo "Pushing docker image to docker hub"
  docker push "singlespa/import-map-deployer:$mostRecentTag"
else
  echo "Skipping docker image push, since no new git tag was detected"
fi