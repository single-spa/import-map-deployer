module Routing.Routes where

import RouteParser exposing (..)

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
