module Resources.Environments where

import Task exposing (Task)
import Http
import Effects exposing (Effects, Never)
import Json.Decode as Json exposing ((:=), at)

import Models.Environment exposing (Environment)
import Actions exposing (Action)

getEnvironments : Effects Action
getEnvironments =
  Http.getString "/environments"
    |> Task.map parseEnvironments
    |> Task.toMaybe
    |> Task.map Actions.GotEnvironments
    |> Effects.task

parseEnvironments : String -> List Environment
parseEnvironments jsonString =
  safeDecodeEnvironment
  (Json.decodeString environmentsDecoder jsonString)

safeDecodeEnvironment : Result String (List Environment) -> List Environment
safeDecodeEnvironment result =
  case result of
    Err msg ->
      []
    Ok environments ->
      environments

environmentsDecoder : Json.Decoder (List Environment)
environmentsDecoder =
  at ["environments"]
    <| Json.list
    <| Json.object2 Environment
      ("name" := Json.string)
      ("isDefault" := Json.bool)
