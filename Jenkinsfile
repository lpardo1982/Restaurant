// =============================================================================
//  SIGR - Sabor & Mesa - Pipeline declarativo de Jenkins (estilo unidad 2.3)
//  Stages: Verificar Entorno -> Instalar Dependencias -> Analisis de Codigo ->
//          Ejecutar Pruebas -> Generar Reporte -> Crear Baseline -> Despliegue
// =============================================================================
//  Para correrlo en Windows con Jenkins:
//   - Agente: any (usa el master)
//   - Python 3.11+ y Git en PATH del servicio Jenkins
//   - Plugins: Pipeline, Git, HTML Publisher, JUnit, Timestamper
//  IMPORTANTE: Sin caracteres especiales en los echo (evita el
//  UnicodeEncodeError 'charmap' que aparece en Windows con cp1252).
// =============================================================================

pipeline {
    agent any

    options {
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    environment {
        BASELINE_TAG  = 'v1.0.0-baseline'
        DEPLOY_DIR    = 'deploy'
        PROJECT_NAME  = 'SIGR-Sabor-Mesa'
        // Fuerza a Python a usar UTF-8 para stdout/stderr (evita charmap)
        PYTHONIOENCODING = 'utf-8'
        PYTHONUTF8       = '1'
    }

    stages {

        // ---------------------------------------------------------------------
        stage('Verificar Entorno') {
            steps {
                echo '=== Verificando herramientas requeridas ==='
                bat '''
                    chcp 65001 > nul
                    python --version
                    pip --version
                    git --version
                    echo Workspace: %WORKSPACE%
                '''
            }
        }

        // ---------------------------------------------------------------------
        stage('Instalar Dependencias') {
            steps {
                echo '=== Instalando dependencias del backend y de pruebas ==='
                bat '''
                    chcp 65001 > nul
                    python -m pip install --user --quiet --upgrade pip
                    python -m pip install --user --quiet -r Backend\\requirements.txt
                    python -m pip install --user --quiet -r tests\\requirements-dev.txt
                '''
            }
        }

        // ---------------------------------------------------------------------
        stage('Analisis de Codigo') {
            steps {
                echo '=== Ejecutando flake8 sobre el backend ==='
                bat '''
                    chcp 65001 > nul
                    python -m flake8 Backend --output-file=flake8-report.txt
                    if errorlevel 1 (
                        echo [WARN] flake8 encontro issues. Revisa flake8-report.txt
                        exit /b 0
                    ) else (
                        echo [OK] flake8 sin issues
                    )
                '''
            }
            post {
                always {
                    archiveArtifacts artifacts: 'flake8-report.txt',
                                     allowEmptyArchive: true,
                                     fingerprint: true
                }
            }
        }

        // ---------------------------------------------------------------------
        stage('Ejecutar Pruebas') {
            steps {
                echo '=== Ejecutando suite de pytest ==='
                bat '''
                    chcp 65001 > nul
                    python -m pytest tests --junitxml=junit.xml ^
                        --html=pytest-report.html --self-contained-html -v
                '''
            }
            post {
                success { echo '=== Todas las pruebas pasaron correctamente ===' }
                failure { echo '=== Algunas pruebas fallaron - pipeline detenido ===' }
                always  { junit allowEmptyResults: true, testResults: 'junit.xml' }
            }
        }

        // ---------------------------------------------------------------------
        stage('Generar Reporte') {
            steps {
                echo '=== Generando reporte de build ==='
                bat '''
                    chcp 65001 > nul
                    if not exist reports mkdir reports
                    echo ============================== > reports\\summary.txt
                    echo REPORTE BUILD #%BUILD_NUMBER%   >> reports\\summary.txt
                    echo ============================== >> reports\\summary.txt
                    echo Proyecto : %PROJECT_NAME%       >> reports\\summary.txt
                    echo Fecha    : %DATE% %TIME%        >> reports\\summary.txt
                    echo Estado   : EXITOSO              >> reports\\summary.txt
                    echo ============================== >> reports\\summary.txt
                    type reports\\summary.txt
                '''
                publishHTML(target: [
                    allowMissing:          true,
                    alwaysLinkToLastBuild: true,
                    keepAll:               true,
                    reportDir:             '.',
                    reportFiles:           'pytest-report.html',
                    reportName:            'Reporte de pruebas'
                ])
                archiveArtifacts artifacts: 'pytest-report.html, junit.xml, reports/summary.txt',
                                 allowEmptyArchive: true,
                                 fingerprint: true
            }
        }

        // ---------------------------------------------------------------------
        stage('Crear Baseline') {
            // Solo en la rama main y solo si todo lo anterior paso
            when {
                allOf {
                    branch 'main'
                    expression { return currentBuild.currentResult == 'SUCCESS' }
                }
            }
            steps {
                echo "=== Creando tag de linea base ${BASELINE_TAG} ==="
                bat """
                    chcp 65001 > nul
                    git config user.email \"jenkins@sigr.local\"
                    git config user.name \"Jenkins CI\"
                    git rev-parse ${BASELINE_TAG} 1> nul 2> nul
                    if errorlevel 1 (
                        git tag -a ${BASELINE_TAG} -m \"Linea base SIGR v1.0.0 - build %BUILD_NUMBER%\"
                        echo [OK] Tag ${BASELINE_TAG} creado en este workspace
                    ) else (
                        echo [INFO] El tag ${BASELINE_TAG} ya existe, no se recrea
                    )
                """
            }
        }

        // ---------------------------------------------------------------------
        stage('Despliegue') {
            steps {
                echo '=== Empaquetando artefacto desplegable ==='
                bat """
                    chcp 65001 > nul
                    if exist ${DEPLOY_DIR} rmdir /s /q ${DEPLOY_DIR}
                    mkdir ${DEPLOY_DIR}
                    xcopy Backend  ${DEPLOY_DIR}\\Backend  /E /I /Q > nul
                    xcopy FrontEnd ${DEPLOY_DIR}\\FrontEnd /E /I /Q > nul
                    xcopy DataBase ${DEPLOY_DIR}\\DataBase /E /I /Q > nul
                    copy README.md    ${DEPLOY_DIR}\\ > nul
                    copy CHANGELOG.md ${DEPLOY_DIR}\\ > nul
                    copy LICENSE.txt  ${DEPLOY_DIR}\\ > nul
                    powershell -Command ^
                        \"Compress-Archive -Force -Path ${DEPLOY_DIR}\\* -DestinationPath sigr-%BUILD_NUMBER%.zip\"
                    echo [OK] Artefacto sigr-%BUILD_NUMBER%.zip generado
                """
                archiveArtifacts artifacts: 'sigr-*.zip',
                                 allowEmptyArchive: true,
                                 fingerprint: true
            }
        }
    }

    // -------------------------------------------------------------------------
    post {
        success {
            echo '=== Pipeline finalizado ==='
            echo "=== Build #${BUILD_NUMBER} - Resultado: SUCCESS ==="
        }
        failure {
            echo '=== Pipeline finalizado ==='
            echo "=== Build #${BUILD_NUMBER} - Resultado: FAILURE ==="
            echo '=== Pipeline fallido. Revisar el stage en rojo ==='
        }
        always {
            echo "Workspace: ${WORKSPACE}"
        }
    }
}
