module Routing.Routes where

import Effects exposing (Effects)

import Actions exposing (Action)
import RouteParser exposing (..)
import Resources.Environments
import Resources.Manifest


type Route
  = EnvironmentsIndex
  | Manifest String
  | NotFound

routeMatches : List (Matcher Route)
routeMatches =
  [ static EnvironmentsIndex "#/environments"
  , dyn1 Manifest "#/environments/" string ""
  ]

matchRoute : String -> Route
matchRoute urlPath =
  let
    maybeRoute = match routeMatches urlPath
  in
    case maybeRoute of
      Just r ->
        r
      Nothing ->
        NotFound

getRouteEffects : Route -> Effects Action
getRouteEffects route =
  case route of
    Manifest  env ->
      Resources.Manifest.getManifest
    EnvironmentsIndex ->
      Resources.Environments.getEnvironments
    _ ->
      Effects.none
