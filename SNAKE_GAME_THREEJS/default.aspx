<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="default.aspx.cs" Inherits="SNAKE_GAME_THREEJS._default" %>

<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <title>SNAKE GAME</title>
    <style>
        html, body {
            margin: 0;
            padding: 0;
            overflow: hidden;
        }
    </style>
</head>
<body>
    <form id="form1" runat="server">
        <div id="webgl"></div>
    </form>
    <script src="js/jquery-3.6.0.min.js"></script>
    <script src="js/three.js"></script>
    <script src="js/OrbitControls.js"></script>
    <script src="js/game.js"></script>
</body>
</html>
