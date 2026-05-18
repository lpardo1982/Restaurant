// =============================================================================
//  SIGR - Sabor & Mesa - Pipeline declarativo de Jenkins
// -----------------------------------------------------------------------------
//  Cubre el contenido de la Unidad 2.3 "Uso de herramientas (Jenkins + Git)":
//  Verificar Entorno -> Instalar Dependencias -> Análisis de Código ->
//  Ejecutar Pruebas -> Generar Reporte -> Crear Baseline -> Despliegue.
//
//  Requisitos en el nodo Jenkins:
//    - Python 3.11+ disponible en PATH
//    - Git instalado
//    - Plugins Jenkins: Pipeline, Git, Pipeline Utility Steps, HTML Publisher,
//      Warnings NG (opcional para flake8), JUnit (incluido).
// =============================================================================

pipeline {
    agent any

    options {
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    environment {
        // Versión que se etiquetará al cerrar la línea base.
        BASELINE_TAG  = 'v1.0.0-baseline'
        // Carpeta donde queda el artefacto desplegable (zip del backend + frontend).
        DEPLOY_DIR    = 'deploy'
        // En Windows el ejecutable es 'python'; en Linux/Mac suele ser 'python3'.
        PYTHON        = isUnix() ? 'python3' : 'python'
        PIP           = isUnix() ? 'pip3'    : 'pip'
    }

    stages {

        // ---------------------------------------------------------------------
        stage('Verificar Entorno') {
            steps {
                echo '=== Verificando herramientas requeridas ==='
                script {
                    if (isUnix()) {
                        sh '''
                            ${PYTHON} --version
                            ${PIP} --version
                            git --version
                            echo "Workspace: ${WORKSPACE}"
                        '''
                    } else {
                        bat '''
                            %PYTHON% --version
                            %PIP% --version
                            git --version
                            echo Workspace: %WORKSPACE%
                        '''
                    }
                }
            }
        }

        // ---------------------------------------------------------------------
        stage('Instalar Dependencias') {
            steps {
                echo '=== Instalando dependencias del backend y de pruebas ==='
                script {
                    if (isUnix()) {
                        sh '''
                            ${PYTHON} -m pip install --user --quiet -r Backend/requirements.txt
                            ${PYTHON} -m pip install --user --quiet -r tests/requirements-dev.txt
                        '''
                    } else {
                        bat '''
                            %PYTHON% -m pip install --user --quiet -r Backend\\requirements.txt
                            %PYTHON% -m pip install --user --quiet -r tests\\requirements-dev.txt
                        '''
                    }
                }
            }
        }

        // ---------------------------------------------------------------------
        stage('Análisis de Código') {
            steps {
                echo '=== Ejecutando flake8 sobre el backend ==='
                script {
                    if (isUnix()) {
                        sh '''
                            ${PYTHON} -m flake8 Backend --output-file=flake8-report.txt || true
                        '''
                    } else {
                        bat '''
                            %PYTHON% -m flake8 Backend --output-file=flake8-report.txt || exit 0
                        '''
                    }
                }
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
                script {
                    if (isUnix()) {
                        sh '''
                            ${PYTHON} -m pytest tests \
                                --junitxml=junit.xml \
                                --html=pytest-report.html --self-contained-html \
                                -q
                        '''
                    } else {
                        bat '''
                            %PYTHON% -m pytest tests ^
                                --junitxml=junit.xml ^
                                --html=pytest-report.html --self-contained-html ^
                                -q
                        '''
                    }
                }
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: 'junit.xml'
                }
            }
        }

        // ---------------------------------------------------------------------
        stage('Generar Reporte') {
            steps {
                echo '=== Publicando reporte HTML de pruebas ==='
                publishHTML(target: [
                    allowMissing:          true,
                    alwaysLinkToLastBuild: true,
                    keepAll:               true,
                    reportDir:             '.',
                    reportFiles:           'pytest-report.html',
                    reportName:            'Reporte de pruebas'
                ])
                archiveArtifacts artifacts: 'pytest-report.html, junit.xml',
                                 allowEmptyArchive: true,
                                 fingerprint: true
            }
        }

        // ---------------------------------------------------------------------
        stage('Crear Baseline') {
            // Solo creamos el tag de línea base cuando el build es de la rama main
            // y todos los stages anteriores pasaron.
            when {
                allOf {
                    branch 'main'
                    expression { return currentBuild.currentResult == 'SUCCESS' }
                }
            }
            steps {
                echo "=== Creando tag de línea base ${BASELINE_TAG} ==="
                script {
                    if (isUnix()) {
                        sh '''
                            git config user.email "jenkins@sigr.local"
                            git config user.name  "Jenkins CI"
                            # Si el tag ya existe lo respetamos (no rompemos el build).
                            if git rev-parse "${BASELINE_TAG}" >/dev/null 2>&1; then
                                echo "El tag ${BASELINE_TAG} ya existe, no se recrea."
                            else
                                git tag -a "${BASELINE_TAG}" -m "Línea base SIGR v1.0.0 - build ${BUILD_NUMBER}"
                                echo "Tag ${BASELINE_TAG} creado localmente."
                                echo "Para publicarlo en el remoto, configurar credenciales y ejecutar:"
                                echo "  git push origin ${BASELINE_TAG}"
                            fi
                        '''
                    } else {
                        bat """
                            git config user.email "jenkins@sigr.local"
                            git config user.name "Jenkins CI"
                            git rev-parse "${BASELINE_TAG}" 2>nul
                            if errorlevel 1 (
                                git tag -a "${BASELINE_TAG}" -m "Linea base SIGR v1.0.0 - build %BUILD_NUMBER%"
                                echo Tag ${BASELINE_TAG} creado localmente.
                            ) else (
                                echo El tag ${BASELINE_TAG} ya existe, no se recrea.
                            )
                        """
                    }
                }
            }
        }

        // ---------------------------------------------------------------------
        stage('Despliegue') {
            steps {
                echo '=== Empaquetando artefacto desplegable ==='
                script {
                    if (isUnix()) {
                        sh '''
                            rm -rf ${DEPLOY_DIR}
                            mkdir -p ${DEPLOY_DIR}
                            cp -R Backend FrontEnd DataBase ${DEPLOY_DIR}/
                            cp README.md CHANGELOG.md LICENSE.txt ${DEPLOY_DIR}/
                            tar -czf sigr-${BUILD_NUMBER}.tar.gz -C ${DEPLOY_DIR} .
                        '''
                    } else {
                        bat """
                            if exist ${DEPLOY_DIR} rmdir /s /q ${DEPLOY_DIR}
                            mkdir ${DEPLOY_DIR}
                            xcopy Backend  ${DEPLOY_DIR}\\Backend  /E /I /Q >nul
                            xcopy FrontEnd ${DEPLOY_DIR}\\FrontEnd /E /I /Q >nul
                            xcopy DataBase ${DEPLOY_DIR}\\DataBase /E /I /Q >nul
                            copy README.md ${DEPLOY_DIR}\\ >nul
                            copy CHANGELOG.md ${DEPLOY_DIR}\\ >nul
                            copy LICENSE.txt ${DEPLOY_DIR}\\ >nul
                            powershell -Command "Compress-Archive -Force -Path ${DEPLOY_DIR}\\* -DestinationPath sigr-%BUILD_NUMBER%.zip"
                        """
                    }
                }
                archiveArtifacts artifacts: 'sigr-*.tar.gz, sigr-*.zip',
                                 allowEmptyArchive: true,
                                 fingerprint: true
            }
        }
    }

    // -------------------------------------------------------------------------
    post {
        success { echo "✔ Pipeline OK - build #${BUILD_NUMBER} en rama ${env.BRANCH_NAME ?: 'desconocida'}" }
        failure { echo "✗ Pipeline FALLÓ - build #${BUILD_NUMBER}" }
        always  { echo "Workspace: ${WORKSPACE}" }
    }
}
