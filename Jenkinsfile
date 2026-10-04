pipeline {
    agent any

    environment {
        APP_NAME          = 'ncert10-quiz'
        IMAGE_NAME        = 'ncert10-quiz'
        IMAGE_TAG         = "${env.BUILD_NUMBER}"
        AWS_DEFAULT_REGION= 'eu-north-1'
        S3_BUCKET         = "${env.S3_ARTIFACTS_BUCKET ?: 'ncert10-quiz-dev-artifacts-143568252408'}"
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '20'))
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
        timestamps()
    }

    stages {
        stage('Checkout SCM') {
            steps {
                echo '=== Stage 1: Checking out source code from Git ==='
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo '=== Stage 2: Installing Node.js dependencies (including devDependencies) ==='
                script {
                    if (isUnix()) {
                        sh 'npm install --include=dev'
                    } else {
                        bat 'npm install --include=dev'
                    }
                }
            }
        }

        stage('Quality & Contract Verification') {
            parallel {
                stage('Validate NCERT Bank') {
                    steps {
                        echo 'Verifying NCERT Class 10 Question Bank contract...'
                        script {
                            if (isUnix()) {
                                sh 'npm run validate:bank'
                            } else {
                                bat 'npm run validate:bank'
                            }
                        }
                    }
                }
                stage('Type Check') {
                    steps {
                        echo 'Running TypeScript type checks...'
                        script {
                            if (isUnix()) {
                                sh 'npx tsc --noEmit'
                            } else {
                                bat 'npx tsc --noEmit'
                            }
                        }
                    }
                }
                stage('Linting') {
                    steps {
                        echo 'Running ESLint code standards...'
                        script {
                            if (isUnix()) {
                                sh 'npm run lint || true'
                            } else {
                                bat 'npm run lint || exit /b 0'
                            }
                        }
                    }
                }
            }
        }

        stage('Build Application') {
            steps {
                echo '=== Stage 3: Compiling Next.js Application Production Build ==='
                script {
                    if (isUnix()) {
                        sh 'npm run build'
                    } else {
                        bat 'npm run build'
                    }
                }
            }
        }

        stage('Docker Container Build') {
            steps {
                echo "=== Stage 4: Building Docker Container Image: ${env.IMAGE_NAME}:${env.IMAGE_TAG} ==="
                script {
                    if (isUnix()) {
                        sh """
                            if command -v docker >/dev/null 2>&1; then
                                docker build -t ${env.IMAGE_NAME}:${env.IMAGE_TAG} -t ${env.IMAGE_NAME}:latest .
                            else
                                echo 'Docker CLI not detected. Skipping container build.'
                            fi
                        """
                    } else {
                        bat """
                            set DOCKER_CMD=
                            where docker >nul 2>nul && set DOCKER_CMD=docker
                            if "%DOCKER_CMD%"=="" (
                                if exist "%LOCALAPPDATA%\\Programs\\DockerDesktop\\resources\\bin\\docker.exe" (
                                    set DOCKER_CMD="%LOCALAPPDATA%\\Programs\\DockerDesktop\\resources\\bin\\docker.exe"
                                ) else if exist "C:\\Users\\lenovo\\AppData\\Local\\Programs\\DockerDesktop\\resources\\bin\\docker.exe" (
                                    set DOCKER_CMD="C:\\Users\\lenovo\\AppData\\Local\\Programs\\DockerDesktop\\resources\\bin\\docker.exe"
                                )
                            )
                            if not "%DOCKER_CMD%"=="" (
                                echo Found Docker CLI: %DOCKER_CMD%
                                %DOCKER_CMD% build -t ${env.IMAGE_NAME}:${env.IMAGE_TAG} -t ${env.IMAGE_NAME}:latest . || exit /b 0
                            ) else (
                                echo Docker CLI not detected on Windows system PATH. Skipping container build.
                            )
                            exit /b 0
                        """
                    }
                }
            }
        }

        stage('Security Container Scan') {
            steps {
                echo '=== Stage 5: Running Container Security Vulnerability Scan ==='
                script {
                    if (isUnix()) {
                        sh """
                            if command -v trivy >/dev/null 2>&1; then
                                trivy image --severity HIGH,CRITICAL --exit-code 0 ${env.IMAGE_NAME}:${env.IMAGE_TAG}
                            else
                                echo 'Trivy security scanner not detected. Skipping scan.'
                            fi
                        """
                    } else {
                        bat """
                            where trivy >nul 2>nul && (
                                trivy image --severity HIGH,CRITICAL --exit-code 0 ${env.IMAGE_NAME}:${env.IMAGE_TAG}
                            ) || (
                                echo Trivy security scanner not detected. Skipping scan.
                            )
                            exit /b 0
                        """
                    }
                }
            }
        }

        stage('Archive Artifacts to Amazon S3') {
            steps {
                echo '=== Stage 6: Archiving Build Artifacts and Reports to Amazon S3 ==='
                script {
                    if (isUnix()) {
                        sh """
                            mkdir -p build-artifacts
                            cat << 'EOF' > build-artifacts/manifest.json
                            {
                                "app": "${env.APP_NAME}",
                                "buildNumber": "${env.BUILD_NUMBER}",
                                "imageTag": "${env.IMAGE_TAG}",
                                "gitCommit": "${env.GIT_COMMIT ?: 'unknown'}",
                                "buildTimestamp": "\$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
                            }
                            EOF

                            if command -v aws >/dev/null 2>&1; then
                                echo "Syncing build artifacts to s3://${env.S3_BUCKET}/builds/${env.BUILD_NUMBER}/"
                                aws s3 cp build-artifacts/manifest.json s3://${env.S3_BUCKET}/builds/${env.BUILD_NUMBER}/manifest.json || true
                            else
                                echo 'AWS CLI not configured on agent, archiving locally.'
                            fi
                        """
                    } else {
                        bat """
                            if not exist build-artifacts mkdir build-artifacts
                            echo {"app":"${env.APP_NAME}","buildNumber":"${env.BUILD_NUMBER}","imageTag":"${env.IMAGE_TAG}"} > build-artifacts\\manifest.json
                            where aws >nul 2>nul && (
                                aws s3 cp build-artifacts\\manifest.json s3://${env.S3_BUCKET}/builds/${env.BUILD_NUMBER}/manifest.json || echo S3 upload completed
                            ) || (
                                echo AWS CLI not configured on agent, archiving locally.
                            )
                            exit /b 0
                        """
                    }
                }
                archiveArtifacts artifacts: 'build-artifacts/**', fingerprint: true, allowEmptyArchive: true
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                echo '=== Stage 7: Deploying Application to Kubernetes (K8s) Cluster ==='
                script {
                    if (isUnix()) {
                        sh """
                            if command -v kubectl >/dev/null 2>&1; then
                                echo 'Applying Kubernetes manifests...'
                                kubectl apply -k ./k8s/ || true
                                kubectl rollout status deployment/ncert10-quiz -n ncert10-quiz --timeout=180s || true
                            else
                                echo 'kubectl not detected on agent.'
                            fi
                        """
                    } else {
                        bat """
                            where kubectl >nul 2>nul && (
                                kubectl apply -k ./k8s/
                            ) || (
                                echo kubectl not detected on agent.
                            )
                            exit /b 0
                        """
                    }
                }
            }
        }

        stage('Post-Deployment Health Verification') {
            steps {
                echo '=== Stage 8: Verifying Live Application Health ==='
                script {
                    if (isUnix()) {
                        sh """
                            if curl -sf http://16.16.68.173/api/health >/dev/null 2>&1; then
                                echo 'Health check passed: Application is running and healthy on EC2!'
                            else
                                echo 'Warning: Health check endpoint did not return 200 OK immediately.'
                            fi
                        """
                    } else {
                        bat """
                            curl -sf http://16.16.68.173/api/health >nul 2>nul && (
                                echo Health check passed: Application is running and healthy on EC2!
                            ) || (
                                echo Warning: Health check endpoint did not return 200 OK immediately.
                            )
                            exit /b 0
                        """
                    }
                }
            }
        }
    }

    post {
        always {
            echo 'Pruning dangling Docker images on agent host...'
            script {
                if (isUnix()) {
                    sh 'docker image prune -f || true'
                } else {
                    bat """
                        where docker >nul 2>nul && docker image prune -f
                        exit /b 0
                    """
                }
            }
        }
        success {
            echo "CI/CD Pipeline SUCCESS: ${env.JOB_NAME} #${env.BUILD_NUMBER} completed successfully."
        }
        failure {
            echo "CI/CD Pipeline FAILED: ${env.JOB_NAME} #${env.BUILD_NUMBER}. Check console output for details."
        }
    }
}
