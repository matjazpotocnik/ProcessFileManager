<?php
// version 2.3.9
declare(strict_types=1);

use Rector\Config\RectorConfig;
use Rector\ValueObject\PhpVersion;
use Rector\CodeQuality\Rector\Class_\InlineConstructorDefaultToPropertyRector;
use Rector\Set\ValueObject\LevelSetList;
use Rector\Set\ValueObject\SetList;
use Rector\Set\ValueObject\DowngradeLevelSetList;
use Rector\CodingStyle\Rector\Encapsed\WrapEncapsedVariableInCurlyBracesRector;

return RectorConfig::configure()
    // Directories to process
    ->withPaths([
     //   __DIR__ . '/src',
    ])

    // PHP version (your minimum version)
    ->withPhpVersion(PhpVersion::PHP_85)

    // Apply selected rule
    ->withRules([
     //   InlineConstructorDefaultToPropertyRector::class,
    ])

    // Enable modern sets (correct API)
    ->withSets([
        LevelSetList::UP_TO_PHP_85,
        SetList::DEAD_CODE,
        SetList::CODE_QUALITY,
        SetList::CODING_STYLE,
    ])

    // Disable specific Rector rules
    ->withSkip([
        // if rector complains for not having {} after if statment
        // Rector doesn't like if($var) return; he likes if ($var) {return;}
        ///Rector\CodeQuality\Rector\If_\CompleteMissingIfElseBracketRector::class,
        
        // If Rector is adding extra newlines you don't want
        ///Rector\CodingStyle\Rector\Stmt\NewlineAfterStatementRector::class,

        // Rector\CodeQuality\Rector\Empty_\EmptyToStrictCheckRector::class,
        ///Rector\CodingStyle\Rector\Encapsed\EncapsedStringsToSprintfRector::class,
        ///Rector\Php80\Rector\NotIdentical\StrContainsRector::class,
        ///Rector\Php80\Rector\Identical\StrStartsWithRector::class,
        ///Rector\CodingStyle\Rector\FuncCall\FunctionFirstClassCallableRector::class,
    ]);
