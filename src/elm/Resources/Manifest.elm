module Resources.Manifest where

import Http exposing (defaultSettings)
import Json.Decode as Decoder exposing (at)
import Json.Encode as Encoder
import Task exposing (Task)
import Effects exposing (Effects)
import Dict

import Actions exposing (Action)
import Models.Manifest exposing (Manifest)

getManifest : Effects Action
getManifest =
  Http.getString "/sofe-manifest.json?env=prod"
    |> Task.map parseManifest
    |> Task.toMaybe
    |> Task.map Actions.GotManifest
    |> Effects.task

parseManifest : String -> Manifest
parseManifest jsonString =
  safeDecodeManifest
  (Decoder.decodeString manifestDecoder jsonString)

safeDecodeManifest : Result String Manifest -> Manifest
safeDecodeManifest result =
  case result of
    Err msg ->
      Dict.empty
    Ok manifest ->
      manifest

manifestDecoder : Decoder.Decoder Manifest
manifestDecoder =
  at ["sofe"]
    <| at ["manifest"]
    <| Decoder.dict Decoder.string

patchManifest : (String, String) -> String -> Effects Action
patchManifest service env =
  Http.send
    defaultSettings
    { verb = "PATCH"
      , headers = [("Content-Type", "application/json")]
      , url = ("/services?env=" ++ env)
      , body = Http.string
          <| Encoder.encode 0
          <| Encoder.object
          <| [ ("service", Encoder.string (fst service))
             , ("url", Encoder.string (snd service))
             ]
    }
    |> Task.toMaybe
    |> Task.map (\a -> Actions.NoOp)
    |> Effects.task
