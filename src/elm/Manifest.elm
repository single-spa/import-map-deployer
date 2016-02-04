module Manifest where

import Html

type alias Manifest = Dict String String

view : Manifest -> Html
view manifest =
  div
    []
    [ (Dict.toList manifest)
        |> List.map
          (\tup ->
            div
              [ style
                [("display", "flex"), ("flex-direction", "row")]
              ]
              [ div
                [ style
                  [("font-weight", "bold")]
                ]
                [ text ((fst tup) ++ ": ")]
              , div
                []
                [ text (snd tup)]
              ]
          )
    ]


update: Maybe Manifest -> Manifest
update manifest =
    Maybe.withDefault Dict.empty manifest


getManifest : Effects Action
getManifest =
  Http.getString "/sofe-manifest.json?env=default"
    |> Task.map parseManifest

parseManifest : String -> Manifest
parseManifest jsonString =
  safeDecodeManifest
  (Json.decodeString manifestDecoder jsonString)

manifestDecoder : Json.Decoder Manifest
manifestDecoder =
  Json.dict Json.keyValuePairs
