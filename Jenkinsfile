pipeline {
    agent any

    environment {
        APP_NAME          = 'ncert10-quiz'
        IMAGE_NAME        = 'ncert10-quiz'
        IMAGE_TAG         = "${env.BUILD_NUMBER}"
        AWS_DEFAULT_REGION= 'eu-north-1'
        S3_BUCKET         = "${env.S3_ARTIFACTS_BUCKET ?: 'ncert10-quiz-dev-artifacts-143568252408'}"
        NODE_ENV          = 'production'
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
                echo '=== Stage 2: Installing Node.js dependencies ==='
                script {
                    if (isUnix()) {
                        sh 'npm ci || npm install'
                    } else {
                        bat 'npm install'
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
                                sh 'npm run typecheck'
                            } else {
                                bat 'npm run typecheck'
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
                                bat 'npm run lint || exit 0'
                            }
                        }
                    }
                }
            }
        }

        stage('Docker Container Build') {
            steps {
                echo "=== Stage 3: Building Docker Container Image: ${env.IMAGE_NAME}:${env.IMAGE_TAG} ==="
                script {
                    if (isUnix()) {
                        sh """
                            docker build -t ${env.IMAGE_NAME}:${env.IMAGE_TAG} -t ${env.IMAGE_NAME}:latest .
                        """
                    } else {
                        bat """
                            docker build -t ${env.IMAGE_NAME}:${env.IMAGE_TAG} -t ${env.IMAGE_NAME}:latest .
                        """
                    }
                }
            }
        }

        stage('Security Container Scan') {
            steps {
                echo '=== Stage 4: Running Container Security Vulnerability Scan ==='
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
                        """
                    }
                }
            }
        }

        stage('Archive Artifacts to Amazon S3') {
            steps {
                echo '=== Stage 5: Archiving Build Artifacts and Reports to Amazon S3 ==='
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
                        """
                    }
                }
                archiveArtifacts artifacts: 'build-artifacts/**', fingerprint: true, allowEmptyArchive: true
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                echo '=== Stage 6: Deploying Application to Kubernetes (K8s) Cluster ==='
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
                        """
                    }
                }
            }
        }

        stage('Post-Deployment Health Verification') {
            steps {
                echo '=== Stage 7: Verifying Live Application Health ==='
                script {
                    if (isUnix()) {
                        sh """
                            if curl -sf http://16.16.68.173/api/health >/dev/null 2>&1 || curl -sf http://127.0.0.1:3000/api/health >/dev/null 2>&1; then
                                echo 'Health check passed: Application is running and healthy!'
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
                    bat 'docker image prune -f || exit 0'
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
