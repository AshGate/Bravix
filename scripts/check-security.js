#!/usr/bin/env node

/**
 * Script de vérification de sécurité
 * Vérifie que les tokens ne sont pas exposés dans le code
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const DANGEROUS_PATTERNS = [
    // Tokens Discord
    /MTIzNDU2[A-Za-z0-9._-]+/g,
    /MTE[A-Za-z0-9._-]+/g,
    /MTM[A-Za-z0-9._-]+/g,
    
    // Client Secrets (32 caractères alphanumériques)
    /[a-zA-Z0-9]{32}/g,
    
    // IDs Discord (17-19 chiffres)
    /\b\d{17,19}\b/g,
    
    // Patterns de tokens génériques
    /token["\s]*[:=]["\s]*[A-Za-z0-9._-]+/gi,
    /secret["\s]*[:=]["\s]*[A-Za-z0-9._-]+/gi,
    /key["\s]*[:=]["\s]*[A-Za-z0-9._-]+/gi,
];

const EXCLUDED_DIRS = [
    'node_modules',
    '.git',
    'dist',
    'build',
    '.next',
    'coverage'
];

const EXCLUDED_FILES = [
    '.env.example',
    'check-security.js',
    'SECURITY.md'
];

function scanFile(filePath) {
    try {
        const content = readFileSync(filePath, 'utf8');
        const issues = [];
        
        DANGEROUS_PATTERNS.forEach((pattern, index) => {
            const matches = content.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    // Ignorer les exemples et placeholders
                    if (match.includes('your_') || 
                        match.includes('example') || 
                        match.includes('placeholder') ||
                        match.includes('MTIzNDU2Nzg5MDEyMzQ1Njc4')) {
                        return;
                    }
                    
                    issues.push({
                        file: filePath,
                        pattern: index,
                        match: match.substring(0, 20) + '...',
                        line: content.substring(0, content.indexOf(match)).split('\n').length
                    });
                });
            }
        });
        
        return issues;
    } catch (error) {
        console.warn(`⚠️ Impossible de lire ${filePath}: ${error.message}`);
        return [];
    }
}

function scanDirectory(dirPath) {
    let allIssues = [];
    
    try {
        const items = readdirSync(dirPath);
        
        for (const item of items) {
            const itemPath = join(dirPath, item);
            const stat = statSync(itemPath);
            
            if (stat.isDirectory()) {
                if (!EXCLUDED_DIRS.includes(item)) {
                    allIssues = allIssues.concat(scanDirectory(itemPath));
                }
            } else if (stat.isFile()) {
                if (!EXCLUDED_FILES.includes(item) && 
                    (item.endsWith('.js') || 
                     item.endsWith('.ts') || 
                     item.endsWith('.tsx') || 
                     item.endsWith('.json') || 
                     item.endsWith('.md'))) {
                    const issues = scanFile(itemPath);
                    allIssues = allIssues.concat(issues);
                }
            }
        }
    } catch (error) {
        console.warn(`⚠️ Impossible de scanner ${dirPath}: ${error.message}`);
    }
    
    return allIssues;
}

function checkGitignore() {
    try {
        const gitignore = readFileSync('.gitignore', 'utf8');
        const requiredEntries = ['.env', '.env.local', '.env.production'];
        const missing = [];
        
        requiredEntries.forEach(entry => {
            if (!gitignore.includes(entry)) {
                missing.push(entry);
            }
        });
        
        return missing;
    } catch (error) {
        return ['Fichier .gitignore manquant'];
    }
}

function main() {
    console.log('🔍 Vérification de sécurité en cours...\n');
    
    // Vérifier .gitignore
    console.log('📋 Vérification du .gitignore...');
    const missingGitignore = checkGitignore();
    if (missingGitignore.length > 0) {
        console.log('❌ Entrées manquantes dans .gitignore:');
        missingGitignore.forEach(entry => console.log(`   - ${entry}`));
        console.log('');
    } else {
        console.log('✅ .gitignore correctement configuré\n');
    }
    
    // Scanner les fichiers
    console.log('🔍 Scan des fichiers pour tokens exposés...');
    const issues = scanDirectory('.');
    
    if (issues.length === 0) {
        console.log('✅ Aucun token exposé détecté !');
        console.log('✅ Votre code semble sécurisé.');
    } else {
        console.log('❌ TOKENS POTENTIELLEMENT EXPOSÉS DÉTECTÉS !');
        console.log('');
        
        issues.forEach(issue => {
            console.log(`🚨 ${issue.file}:${issue.line}`);
            console.log(`   Pattern: ${issue.match}`);
            console.log('');
        });
        
        console.log('⚠️ ACTIONS REQUISES:');
        console.log('1. Révoquer immédiatement tous les tokens exposés');
        console.log('2. Générer de nouveaux tokens');
        console.log('3. Utiliser des variables d\'environnement');
        console.log('4. Ajouter .env au .gitignore');
        
        process.exit(1);
    }
    
    console.log('\n🛡️ Vérification de sécurité terminée.');
}

main();