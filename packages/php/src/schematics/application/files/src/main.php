<?php
$includePath = [
    __DIR__ . DIRECTORY_SEPARATOR . 'lib',
    __DIR__ . DIRECTORY_SEPARATOR .'..'. DIRECTORY_SEPARATOR.'..'. DIRECTORY_SEPARATOR .'lib',
    get_include_path()
];
set_include_path(implode(PATH_SEPARATOR, $includePath));